import { randomUUID } from "node:crypto";
import { decodeCheckpointMessage, encodeCheckpointMessage, sanitizeText } from "./message";
import { HeuristicSummarizer, type CheckpointSummarizer } from "./summarize";
import { SCHEMA_VERSION, type Checkpoint, type CheckpointMeta, type CheckpointType } from "./types";
import { ShadowGitStore } from "../storage/shadowGit";
import { Mutex } from "../util/mutex";

export interface CreateCheckpointOptions {
  type?: Exclude<CheckpointType, "origin">;
  title?: string;
  description?: string;
}

/**
 * High-level checkpoint operations. Serializes everything through a mutex because
 * the store shares one scratch index and one active-checkpoint pointer.
 */
export class CheckpointEngine {
  private readonly store: ShadowGitStore;
  private readonly mutex = new Mutex();

  constructor(
    workspaceRoot: string,
    private readonly summarizer: CheckpointSummarizer = new HeuristicSummarizer(),
  ) {
    this.store = new ShadowGitStore(workspaceRoot);
  }

  async getActiveCheckpoint(): Promise<Checkpoint | null> {
    const oid = await this.store.getActiveOid();
    if (!oid) return null;
    const commit = await this.store.readCommit(oid);
    return { ...decodeCheckpointMessage(commit.message, oid), oid };
  }

  /** Newest first. */
  async listCheckpoints(): Promise<Checkpoint[]> {
    const refs = await this.store.listCheckpointRefs();
    if (refs.length === 0) return [];
    const commits = await this.store.listCommits();
    const byOid = new Map(commits.map((commit) => [commit.oid, commit]));
    const checkpoints = refs.map((ref) => {
      const commit = byOid.get(ref.oid);
      if (!commit) {
        throw new Error(`Checkpoint ref ${ref.id} points to a missing commit (${ref.oid}).`);
      }
      return { ...decodeCheckpointMessage(commit.message, ref.oid), oid: ref.oid };
    });
    return checkpoints.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /**
   * Creates a checkpoint of the current worktree. The first call in a workspace also
   * creates the origin baseline, so the returned checkpoint is always a real capture.
   */
  async createCheckpoint(options: CreateCheckpointOptions = {}): Promise<Checkpoint> {
    return this.mutex.run(async () => {
      await this.store.ensure();
      let parent = await this.getActiveCheckpoint();
      if (!parent) {
        const existing = await this.listCheckpoints();
        if (existing.length > 0) {
          // The active ref went missing while history exists; heal it to the newest node.
          parent = existing[0];
          await this.store.setActive(parent.oid);
        }
      }
      if (!parent) {
        parent = await this.writeNode({
          type: "origin",
          title: "Origin",
          description: "Baseline snapshot taken when this workspace's checkpoint store was created.",
          parent: null,
        });
      }
      return this.writeNode({
        type: options.type ?? "manual",
        title: options.title,
        description: options.description,
        parent,
      });
    });
  }

  async restoreCheckpoint(id: string): Promise<Checkpoint> {
    return this.mutex.run(async () => {
      const checkpoints = await this.listCheckpoints();
      const target = checkpoints.find((checkpoint) => checkpoint.id === id);
      if (!target) {
        throw new Error(`Unknown checkpoint: ${id}`);
      }
      await this.store.restoreTree(target.oid);
      await this.store.setActive(target.oid);
      return target;
    });
  }

  /** Caller must hold the mutex. */
  private async writeNode(input: {
    type: CheckpointType;
    title?: string;
    description?: string;
    parent: Checkpoint | null;
  }): Promise<Checkpoint> {
    const parentOid = input.parent?.oid ?? null;
    await this.store.snapshotWorktreeIntoIndex(parentOid);
    const treeOid = await this.store.writeTree();
    const changed = await this.store.diffNames(parentOid, treeOid);
    const summary = await this.summarizer.summarize({
      type: input.type,
      changedPaths: changed.map((entry) => entry.path),
    });
    const meta: CheckpointMeta = {
      schemaVersion: SCHEMA_VERSION,
      id: randomUUID(),
      type: input.type,
      title: sanitizeText(input.title ?? summary.title),
      description: sanitizeText(input.description ?? summary.description),
      createdAt: new Date().toISOString(),
      parentId: input.parent?.id ?? null,
    };
    const oid = await this.store.commitTree({
      tree: treeOid,
      parentOid,
      message: encodeCheckpointMessage(meta),
    });
    await this.store.addCheckpointRef(meta.id, oid);
    await this.store.setActive(oid);
    return { ...meta, oid };
  }
}
