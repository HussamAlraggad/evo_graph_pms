import * as fs from "node:fs/promises";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ShadowGitStore } from "../src/storage/shadowGit";
import { runGit } from "../src/util/git";
import {
  createTempWorkspace,
  readWorkspaceFile,
  removeTempWorkspace,
  workspacePathExists,
  writeWorkspaceFile,
} from "./helpers";

describe("ShadowGitStore", () => {
  let root: string;
  let store: ShadowGitStore;

  beforeEach(async () => {
    root = await createTempWorkspace();
    store = new ShadowGitStore(root);
  });

  afterEach(async () => {
    await removeTempWorkspace(root);
  });

  async function commitSnapshot(parentOid: string | null, message: string): Promise<string> {
    await store.snapshotWorktreeIntoIndex(parentOid);
    const tree = await store.writeTree();
    return store.commitTree({ tree, parentOid, message });
  }

  it("creates the shadow store and is idempotent", async () => {
    await store.ensure();
    expect(await store.exists()).toBe(true);
    await store.ensure();
    expect(await workspacePathExists(root, path.join(".evograph", "store.git", "HEAD"))).toBe(true);
  });

  it("returns null for the active checkpoint when the store is missing or empty", async () => {
    expect(await store.getActiveOid()).toBeNull();
    await store.ensure();
    expect(await store.getActiveOid()).toBeNull();
  });

  it("snapshots the worktree and chains follow-up snapshots to the parent", async () => {
    await writeWorkspaceFile(root, "app.ts", "one");
    await writeWorkspaceFile(root, "src/util.ts", "two");
    await store.ensure();
    const first = await commitSnapshot(null, "first");
    await store.setActive(first);
    expect(await store.getActiveOid()).toBe(first);

    await writeWorkspaceFile(root, "app.ts", "one-changed");
    const second = await commitSnapshot(first, "second");
    const record = await store.readCommit(second);
    expect(record.parentOids).toEqual([first]);
    expect(record.message).toContain("second");

    const firstRecord = await store.readCommit(first);
    expect(firstRecord.parentOids).toEqual([]);
  });

  it("lists all files as added for the initial snapshot", async () => {
    await writeWorkspaceFile(root, "app.ts", "one");
    await writeWorkspaceFile(root, "docs/note.md", "note");
    await store.ensure();
    await store.snapshotWorktreeIntoIndex(null);
    const tree = await store.writeTree();
    const diffs = await store.diffNames(null, tree);
    expect(diffs).toEqual(
      expect.arrayContaining([
        { status: "A", path: "app.ts" },
        { status: "A", path: "docs/note.md" },
      ]),
    );
  });

  it("reports additions, modifications and deletions between snapshots", async () => {
    await writeWorkspaceFile(root, "keep.ts", "keep");
    await writeWorkspaceFile(root, "gone.ts", "gone");
    await store.ensure();
    const first = await commitSnapshot(null, "first");

    await writeWorkspaceFile(root, "keep.ts", "keep-updated");
    await writeWorkspaceFile(root, "added.ts", "added");
    await fs.rm(path.join(root, "gone.ts"));
    await store.snapshotWorktreeIntoIndex(first);
    const tree = await store.writeTree();

    const diffs = await store.diffNames(first, tree);
    expect(diffs).toEqual(
      expect.arrayContaining([
        { status: "M", path: "keep.ts" },
        { status: "A", path: "added.ts" },
        { status: "D", path: "gone.ts" },
      ]),
    );
  });

  it("restores the workspace exactly, including deletions and additions", async () => {
    await writeWorkspaceFile(root, "app.ts", "original");
    await writeWorkspaceFile(root, "keep.ts", "keep");
    await store.ensure();
    const first = await commitSnapshot(null, "first");

    await writeWorkspaceFile(root, "app.ts", "changed");
    await writeWorkspaceFile(root, "extra.ts", "extra");
    await fs.rm(path.join(root, "keep.ts"));
    const second = await commitSnapshot(first, "second");

    await store.restoreTree(first);
    expect(await readWorkspaceFile(root, "app.ts")).toBe("original");
    expect(await readWorkspaceFile(root, "keep.ts")).toBe("keep");
    expect(await workspacePathExists(root, "extra.ts")).toBe(false);

    await store.restoreTree(second);
    expect(await readWorkspaceFile(root, "app.ts")).toBe("changed");
    expect(await readWorkspaceFile(root, "extra.ts")).toBe("extra");
    expect(await workspacePathExists(root, "keep.ts")).toBe(false);
  });

  it("respects ignore rules and never snapshots the store directory", async () => {
    await writeWorkspaceFile(root, ".gitignore", "node_modules/\nignored.txt\n");
    await writeWorkspaceFile(root, "node_modules/pkg/index.js", "module");
    await writeWorkspaceFile(root, "ignored.txt", "ignored");
    await writeWorkspaceFile(root, "tracked.ts", "tracked");
    await store.ensure();
    await store.snapshotWorktreeIntoIndex(null);
    const tree = await store.writeTree();

    const listing = await runGit(["--git-dir", store.gitDir, "ls-tree", "-r", "--name-only", tree]);
    const paths = listing
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    expect(paths).toContain(".gitignore");
    expect(paths).toContain("tracked.ts");
    expect(paths).not.toContain("ignored.txt");
    expect(paths.some((entry) => entry.startsWith("node_modules/"))).toBe(false);
    expect(paths.some((entry) => entry.startsWith(".evograph/"))).toBe(false);
  });

  it("keeps sibling branches reachable through per-checkpoint refs", async () => {
    await writeWorkspaceFile(root, "app.ts", "base");
    await store.ensure();
    const first = await commitSnapshot(null, "first");
    await store.addCheckpointRef("11111111-1111-4111-8111-111111111111", first);

    await writeWorkspaceFile(root, "app.ts", "branch-b");
    const second = await commitSnapshot(first, "second");
    await store.addCheckpointRef("22222222-2222-4222-8222-222222222222", second);

    await writeWorkspaceFile(root, "app.ts", "branch-c");
    const third = await commitSnapshot(first, "third");
    await store.addCheckpointRef("33333333-3333-4333-8333-333333333333", third);

    const commits = await store.listCommits();
    const oids = commits.map((commit) => commit.oid);
    expect(oids).toEqual(expect.arrayContaining([first, second, third]));

    const refs = await store.listCheckpointRefs();
    expect(refs).toHaveLength(3);
    expect(refs).toEqual(
      expect.arrayContaining([
        { id: "11111111-1111-4111-8111-111111111111", oid: first },
        { id: "22222222-2222-4222-8222-222222222222", oid: second },
        { id: "33333333-3333-4333-8333-333333333333", oid: third },
      ]),
    );

    const thirdRecord = await store.readCommit(third);
    expect(thirdRecord.parentOids).toEqual([first]);
  });

  it("rejects invalid checkpoint ids for refs", async () => {
    await store.ensure();
    await expect(store.addCheckpointRef("not a valid id!", "0".repeat(40))).rejects.toThrow(
      /Invalid checkpoint id/,
    );
  });

  it("persists checkpoints across store instances", async () => {
    await writeWorkspaceFile(root, "app.ts", "base");
    await store.ensure();
    const first = await commitSnapshot(null, "first");
    const id = "44444444-4444-4444-8444-444444444444";
    await store.addCheckpointRef(id, first);

    const reloaded = new ShadowGitStore(root);
    const refs = await reloaded.listCheckpointRefs();
    expect(refs).toEqual([{ id, oid: first }]);
    const commits = await reloaded.listCommits();
    expect(commits.map((commit) => commit.oid)).toEqual([first]);
  });
});
