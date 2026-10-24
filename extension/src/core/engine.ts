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

export interface GraphModel {
  /** Oldest first: the sheet reads top-down by time. */
  checkpoints: Checkpoint[];
  activeId: string | null;
  visitedIds: string[];
}

export interface SwitchResult {
  target: Checkpoint;
  /** The auto-save checkpoint created when uncheckpointed changes existed, if any. */
  safety: Checkpoint | null;
}

export interface DeleteResult {
  deleted: Checkpoint;
  reattached: Checkpoint[];
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

  /** Full model for the graph panel. */
  async getGraphModel(): Promise<GraphModel> {
    const [checkpointsNewestFirst, state, active] = await Promise.all([
      this.listCheckpoints(),
      this.store.readState(),
      this.getActiveCheckpoint(),
    ]);
    return {
      checkpoints: [...checkpointsNewestFirst].reverse(),
      activeId: active?.id ?? null,
      visitedIds: state.visitedIds,
    };
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

  /**
   * The graph panel's click behavior: restores the target, and when uncheckpointed
   * changes exist, snapshots them into a safety checkpoint first (nothing is ever
   * lost silently, and no dialog interrupts the switch).
   */
  async switchToCheckpoint(id: string): Promise<SwitchResult> {
    return this.mutex.run(async () => {
      const target = (await this.listCheckpoints()).find((checkpoint) => checkpoint.id === id);
      if (!target) throw new Error(`Unknown checkpoint: ${id}`);

      const active = await this.getActiveCheckpoint();
      let worktreeTree: string | null = null;
      let safety: Checkpoint | null = null;
      if (active) {
        await this.store.snapshotWorktreeIntoIndex(active.oid);
        worktreeTree = await this.store.writeTree();
        const activeTree = await this.store.getTreeOid(active.oid);
        if (worktreeTree !== activeTree) {
          safety = await this.writeNode({
            type: "manual",
            title: "Auto-save before switching",
            description: `Saved automatically because the workspace had uncheckpointed changes when switching to "${target.title}".`,
            parent: active,
          });
        }
      }

      const targetTree = await this.store.getTreeOid(target.oid);
      if (worktreeTree === null || worktreeTree !== targetTree) {
        await this.store.restoreTree(target.oid);
      }
      await this.store.setActive(target.oid);
      await this.markVisited(target.id);
      return { target, safety };
    });
  }

  /**
   * Deletes a checkpoint; its children reattach to its parent. The origin cannot be
   * deleted. Deleting the active checkpoint moves the active pointer to the parent
   * without touching the workspace files.
   */
  async deleteCheckpoint(id: string): Promise<DeleteResult> {
    return this.mutex.run(async () => {
      const checkpoints = await this.listCheckpoints();
      const target = checkpoints.find((checkpoint) => checkpoint.id === id);
      if (!target) throw new Error(`Unknown checkpoint: ${id}`);
      if (target.type === "origin") throw new Error("The origin checkpoint cannot be deleted.");
      const parent = checkpoints.find((checkpoint) => checkpoint.id === target.parentId);
      if (!parent) throw new Error(`Checkpoint ${id} has no parent to reattach children to.`);

      const activeBefore = await this.getActiveCheckpoint();
      const reattached: Checkpoint[] = [];
      for (const child of checkpoints.filter((checkpoint) => checkpoint.parentId === target.id)) {
        const treeOid = await this.store.getTreeOid(child.oid);
        const meta: CheckpointMeta = {
          schemaVersion: SCHEMA_VERSION,
          id: child.id,
          type: child.type,
          title: child.title,
          description: child.description,
          createdAt: child.createdAt,
          parentId: parent.id,
        };
        if (child.taskId) meta.taskId = child.taskId;
        const newOid = await this.store.commitTree({
          tree: treeOid,
          parentOid: parent.oid,
          message: encodeCheckpointMessage(meta),
        });
        await this.store.addCheckpointRef(child.id, newOid);
        if (activeBefore?.id === child.id) await this.store.setActive(newOid);
        reattached.push({ ...meta, oid: newOid });
      }

      await this.store.removeCheckpointRef(target.id);
      if (activeBefore?.id === target.id) {
        await this.store.setActive(parent.oid);
      }

      const state = await this.store.readState();
      await this.store.writeState({
        visitedIds: state.visitedIds.filter((visitedId) => visitedId !== target.id),
      });
      return { deleted: target, reattached };
    });
  }

  private async markVisited(id: string): Promise<void> {
    const state = await this.store.readState();
    if (!state.visitedIds.includes(id)) {
      await this.store.writeState({ visitedIds: [...state.visitedIds, id] });
    }
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
    await this.markVisited(meta.id);
    return { ...meta, oid };
  }
}
