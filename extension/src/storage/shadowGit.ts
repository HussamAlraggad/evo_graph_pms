import * as fs from "node:fs/promises";
import * as path from "node:path";
import { runGit } from "../util/git";

const ACTIVE_REF = "refs/evograph/active";
const CHECKPOINTS_REF_PREFIX = "refs/evograph/checkpoints/";
const CHECKPOINT_ID_PATTERN = /^[0-9a-fA-F-]{1,64}$/;
const EXCLUDE_FILE_CONTENT =
  "# EvoGraph shadow store: never snapshot these paths\n.evograph/\n.git/\n";
const MIN_GIT_VERSION: readonly [number, number] = [2, 30];

export interface CommitRecord {
  oid: string;
  parentOids: string[];
  message: string;
}

export interface CheckpointRef {
  id: string;
  oid: string;
}

export interface NameStatusEntry {
  status: string;
  path: string;
}

export interface CommitTreeInput {
  tree: string;
  parentOid: string | null;
  message: string;
}

/**
 * Low-level shadow-git store: a bare Git repository under <workspace>/.evograph/store.git
 * that snapshots the workspace without touching the workspace's own Git repository.
 *
 * All operations are synchronous git plumbing calls; callers must serialize access
 * (the engine uses a Mutex) because the store shares one scratch index.
 */
export class ShadowGitStore {
  constructor(private readonly workspaceRoot: string) {}

  get storeDir(): string {
    return path.join(this.workspaceRoot, ".evograph");
  }

  get gitDir(): string {
    return path.join(this.storeDir, "store.git");
  }

  get indexPath(): string {
    return path.join(this.storeDir, "scratch.index");
  }

  async exists(): Promise<boolean> {
    try {
      await fs.access(path.join(this.gitDir, "HEAD"));
      return true;
    } catch {
      return false;
    }
  }

  /** Creates the shadow repository (idempotent) and validates the git version. */
  async ensure(): Promise<void> {
    if (await this.exists()) return;
    await this.checkGitVersion();
    await fs.mkdir(this.storeDir, { recursive: true });
    await runGit(["init", "--bare", "--quiet", this.gitDir]);
    const identity = await this.resolveIdentity();
    await runGit([...this.gitArgs(), "config", "user.name", identity.name]);
    await runGit([...this.gitArgs(), "config", "user.email", identity.email]);
    await runGit([...this.gitArgs(), "config", "commit.gpgsign", "false"]);
    await fs.mkdir(path.join(this.gitDir, "info"), { recursive: true });
    await fs.writeFile(path.join(this.gitDir, "info", "exclude"), EXCLUDE_FILE_CONTENT, "utf8");
  }

  async getActiveOid(): Promise<string | null> {
    if (!(await this.exists())) return null;
    try {
      const oid = (await runGit([...this.gitArgs(), "rev-parse", "--verify", "--quiet", ACTIVE_REF])).trim();
      return oid.length > 0 ? oid : null;
    } catch {
      // rev-parse exits 1 when the ref does not exist yet; that is a normal empty state.
      return null;
    }
  }

  async setActive(oid: string): Promise<void> {
    await runGit([...this.gitArgs(), "update-ref", ACTIVE_REF, oid]);
  }

  async addCheckpointRef(id: string, oid: string): Promise<void> {
    if (!CHECKPOINT_ID_PATTERN.test(id)) {
      throw new Error(`Invalid checkpoint id for a git ref: ${id}`);
    }
    await runGit([...this.gitArgs(), "update-ref", `${CHECKPOINTS_REF_PREFIX}${id}`, oid]);
  }

  async listCheckpointRefs(): Promise<CheckpointRef[]> {
    if (!(await this.exists())) return [];
    // for-each-ref does not support %x1f escapes; a literal tab is safe (refnames cannot contain tabs).
    const output = await runGit([
      ...this.gitArgs(),
      "for-each-ref",
      "--format=%(refname:short)\t%(objectname)",
      CHECKPOINTS_REF_PREFIX,
    ]);
    return output
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const [refName = "", oid = ""] = line.split("\t");
        const id = refName.slice(refName.lastIndexOf("/") + 1);
        return { id, oid };
      });
  }

  /**
   * Stages the worktree into the scratch index. The index is preloaded with the parent
   * tree so `add` only hashes changed files; the result is exactly the worktree state
   * as described by the workspace's ignore rules.
   */
  async snapshotWorktreeIntoIndex(parentOid: string | null): Promise<void> {
    const env = this.indexEnv();
    if (parentOid) {
      await runGit([...this.gitArgs(), "read-tree", parentOid], { env });
    } else {
      await runGit([...this.gitArgs(), "read-tree", "--empty"], { env });
    }
    await runGit([...this.worktreeGitArgs(), "add", "-A", "."], { cwd: this.workspaceRoot, env });
  }

  async writeTree(): Promise<string> {
    return (await runGit([...this.gitArgs(), "write-tree"], { env: this.indexEnv() })).trim();
  }

  async commitTree(input: CommitTreeInput): Promise<string> {
    const args = [...this.gitArgs(), "commit-tree", input.tree];
    if (input.parentOid) args.push("-p", input.parentOid);
    args.push("--no-gpg-sign", "-m", input.message);
    return (await runGit(args)).trim();
  }

  async readCommit(oid: string): Promise<CommitRecord> {
    const output = await runGit([...this.gitArgs(), "log", "-1", "--format=%P%x1f%B", oid]);
    const [parents = "", ...bodyParts] = output.split("\x1f");
    return {
      oid,
      parentOids: splitOids(parents),
      message: bodyParts.join("\x1f"),
    };
  }

  /** Returns every checkpoint commit in one call (order is not meaningful; the engine sorts). */
  async listCommits(): Promise<CommitRecord[]> {
    if (!(await this.exists())) return [];
    const refs = await this.listCheckpointRefs();
    if (refs.length === 0) return [];
    const output = await runGit([
      ...this.gitArgs(),
      "log",
      "--no-walk=unsorted",
      "--format=%H%x1f%P%x1f%B%x1e",
      ...refs.map((ref) => ref.oid),
    ]);
    return output
      .split("\x1e")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
      .map((entry) => {
        const [oid = "", parents = "", ...bodyParts] = entry.split("\x1f");
        return {
          oid,
          parentOids: splitOids(parents),
          message: bodyParts.join("\x1f"),
        };
      });
  }

  /**
   * Name-status diff between the parent commit (or an empty tree when null)
   * and the new snapshot tree.
   */
  async diffNames(parentOid: string | null, treeOid: string): Promise<NameStatusEntry[]> {
    if (!parentOid) {
      const output = await runGit([...this.gitArgs(), "ls-tree", "-r", "--name-only", treeOid]);
      return output
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((relativePath) => ({ status: "A", path: relativePath }));
    }
    const output = await runGit([
      ...this.gitArgs(),
      "diff-tree",
      "-r",
      "--name-status",
      "--no-commit-id",
      "--no-renames",
      parentOid,
      treeOid,
    ]);
    return output
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const [status = "", ...pathParts] = line.split("\t");
        return { status, path: pathParts.join("\t") };
      });
  }

  /**
   * Restores the workspace to the snapshot commit exactly: every file in the tree is
   * written, files that are not in the tree are deleted (ignored files survive),
   * and emptied directories are pruned.
   */
  async restoreTree(oid: string): Promise<void> {
    const env = this.indexEnv();
    await runGit([...this.gitArgs(), "read-tree", oid], { env });
    await runGit([...this.worktreeGitArgs(), "checkout-index", "-a", "-f"], {
      cwd: this.workspaceRoot,
      env,
    });
    await this.removeUntrackedFiles();
  }

  private async removeUntrackedFiles(): Promise<void> {
    const output = await runGit(
      [...this.worktreeGitArgs(), "ls-files", "-o", "--exclude-standard", "-z"],
      { cwd: this.workspaceRoot, env: this.indexEnv() },
    );
    const relativePaths = output.split("\0").filter((entry) => entry.length > 0);
    const directories = new Set<string>();
    for (const relativePath of relativePaths) {
      const absolutePath = path.resolve(this.workspaceRoot, relativePath);
      if (!isInside(this.workspaceRoot, absolutePath)) {
        throw new Error(`Refusing to delete a path outside the workspace: ${relativePath}`);
      }
      await fs.rm(absolutePath, { force: true });
      directories.add(path.dirname(absolutePath));
    }
    await pruneEmptyDirectories(directories, this.workspaceRoot);
  }

  private async checkGitVersion(): Promise<void> {
    const output = await runGit(["--version"]);
    const match = /git version (\d+)\.(\d+)/.exec(output);
    if (!match) {
      throw new Error(`Could not parse the git version from: ${output.trim()}`);
    }
    const major = Number(match[1]);
    const minor = Number(match[2]);
    const [requiredMajor, requiredMinor] = MIN_GIT_VERSION;
    if (major < requiredMajor || (major === requiredMajor && minor < requiredMinor)) {
      throw new Error(`Git ${requiredMajor}.${requiredMinor}+ is required (found ${major}.${minor}).`);
    }
  }

  private async resolveIdentity(): Promise<{ name: string; email: string }> {
    const name = (await this.readWorkspaceGitConfig("user.name")) ?? "EvoGraph Checkpoints";
    const email = (await this.readWorkspaceGitConfig("user.email")) ?? "checkpoints@evograph.local";
    return { name, email };
  }

  private async readWorkspaceGitConfig(key: string): Promise<string | null> {
    try {
      const value = (await runGit(["config", "--get", key], { cwd: this.workspaceRoot })).trim();
      return value.length > 0 ? value : null;
    } catch {
      // Missing or unreadable config is a normal case; fall back to the default identity.
      return null;
    }
  }

  private gitArgs(): string[] {
    return ["--git-dir", this.gitDir];
  }

  private worktreeGitArgs(): string[] {
    return ["--git-dir", this.gitDir, "--work-tree", this.workspaceRoot];
  }

  private indexEnv(): NodeJS.ProcessEnv {
    return { GIT_INDEX_FILE: this.indexPath };
  }
}

function splitOids(value: string): string[] {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.split(" ") : [];
}

function isInside(root: string, target: string): boolean {
  const normalizedRoot = path.resolve(root);
  return target.startsWith(normalizedRoot + path.sep);
}

async function pruneEmptyDirectories(directories: Set<string>, root: string): Promise<void> {
  const deepestFirst = [...directories].sort((a, b) => b.length - a.length);
  for (const directory of deepestFirst) {
    let current = directory;
    while (isInside(root, current)) {
      try {
        await fs.rmdir(current);
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code === "ENOENT") {
          // Already gone; keep walking up.
        } else if (code === "ENOTEMPTY") {
          break;
        } else {
          throw error;
        }
      }
      current = path.dirname(current);
    }
  }
}
