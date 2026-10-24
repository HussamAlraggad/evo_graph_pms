import { randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { AssistantProvider, AssistantReply } from "../ai/provider";
import { ConversationStore, type ChatMessage } from "./conversations";
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

export interface SendPromptResult {
  promptCheckpoint: Checkpoint;
  reply: AssistantReply;
  conversation: ChatMessage[];
}

export interface ConversationState {
  /** The checkpoint whose sidecar holds this conversation; null when none exists on the line. */
  sourceId: string | null;
  messages: ChatMessage[];
}

export interface ApplyCodeBlockInput {
  /** The checkpoint whose conversation produced the block (the block is looked up there). */
  nodeId: string;
  /** Workspace-relative target path from the block's `file:` tag. */
  file: string;
  /** Full replacement contents of the file. */
  content: string;
  /** Provenance of the reply that produced the block, when the source node recorded it. */
  provider?: string;
  model?: string;
}

export interface ApplyCodeBlockResult {
  checkpoint: Checkpoint;
  safety: Checkpoint | null;
}

/**
 * High-level checkpoint and assistant operations. Serializes everything through a
 * mutex because the store shares one scratch index and one active-checkpoint pointer.
 * Note: sendPrompt holds the mutex across the provider call (M2 simplicity); only
 * checkpoint-mutating operations wait behind it.
 */
export class CheckpointEngine {
  private readonly store: ShadowGitStore;
  private readonly conversations: ConversationStore;
  private readonly mutex = new Mutex();

  constructor(
    private readonly workspaceRoot: string,
    private readonly summarizer: CheckpointSummarizer = new HeuristicSummarizer(),
  ) {
    this.store = new ShadowGitStore(workspaceRoot);
    this.conversations = new ConversationStore(workspaceRoot);
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
   * The conversation state for a node: its own sidecar when present, otherwise the
   * nearest ancestor's (an applied-change node shows the exchange that produced it).
   */
  async getConversation(nodeId: string): Promise<ConversationState> {
    const checkpoints = await this.listCheckpoints();
    return this.walkConversation(nodeId, checkpoints);
  }

  /**
   * Creates a checkpoint of the current worktree. The first call in a workspace also
   * creates the origin baseline, so the returned checkpoint is always a real capture.
   */
  async createCheckpoint(options: CreateCheckpointOptions = {}): Promise<Checkpoint> {
    return this.mutex.run(async () => {
      const baseline = await this.ensureBaselineLocked();
      return this.writeNode({
        type: options.type ?? "manual",
        title: options.title,
        description: options.description,
        parent: baseline,
      });
    });
  }

  /**
   * Sends a prompt through the provider and records the exchange as an ai_prompt
   * checkpoint whose conversation sidecar holds the full interaction state. An
   * exchange that fails leaves no checkpoint behind.
   */
  async sendPrompt(text: string, provider: AssistantProvider): Promise<SendPromptResult> {
    return this.mutex.run(async () => {
      const trimmed = text.trim();
      if (trimmed.length === 0) throw new Error("The prompt is empty.");
      const parent = await this.ensureBaselineLocked();
      const history = (await this.walkConversation(parent.id, await this.listCheckpoints())).messages;
      const userMessage: ChatMessage = {
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      const reply = await provider.chat([...history, userMessage]);
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: reply.content,
        createdAt: new Date().toISOString(),
      };
      const conversation = [...history, userMessage, assistantMessage];
      const checkpoint = await this.writeNode({
        type: "ai_prompt",
        title: `Prompt: ${preview(trimmed, 60)}`,
        description: preview(collapseWhitespace(reply.content), 200),
        parent,
        provider: reply.provider,
        model: reply.model,
      });
      await this.conversations.write(checkpoint.id, conversation);
      return { promptCheckpoint: checkpoint, reply, conversation };
    });
  }

  /**
   * Applies an AI-suggested file change: uncheckpointed work is auto-saved first,
   * then the file is written and an ai_applied checkpoint (child of the node whose
   * conversation produced the block) records the new state.
   */
  /**
   * Applies an AI-suggested file change: uncheckpointed work is auto-saved first,
   * then the file is written and an ai_applied checkpoint records the new state.
   * The applied node follows the line the workspace was on — the safety checkpoint
   * when one was written, otherwise the active checkpoint — so the sheet reads the
   * apply as the next moment of the ride rather than a sibling branch.
   */
  async applyCodeBlock(input: ApplyCodeBlockInput): Promise<ApplyCodeBlockResult> {
    const target = this.resolveWorkspacePath(input.file);
    return this.mutex.run(async () => {
      const source = (await this.listCheckpoints()).find((checkpoint) => checkpoint.id === input.nodeId);
      if (!source) throw new Error(`Unknown checkpoint: ${input.nodeId}`);

      const active = await this.getActiveCheckpoint();
      let safety: Checkpoint | null = null;
      let parent: Checkpoint = active ?? source;
      if (active) {
        await this.store.snapshotWorktreeIntoIndex(active.oid);
        const worktreeTree = await this.store.writeTree();
        const activeTree = await this.store.getTreeOid(active.oid);
        if (worktreeTree !== activeTree) {
          safety = await this.writeNode({
            type: "manual",
            title: "Auto-save before applying",
            description: `Saved automatically because the workspace had uncheckpointed changes before applying AI changes to ${input.file}.`,
            parent: active,
          });
          parent = safety;
        }
      }

      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, input.content, "utf8");

      const checkpoint = await this.writeNode({
        type: "ai_applied",
        title: `AI applied: ${path.basename(input.file)}`,
        description: `Applied an AI-suggested change to ${input.file}.`,
        parent,
        provider: input.provider,
        model: input.model,
      });
      return { checkpoint, safety };
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
        if (child.provider) meta.provider = child.provider;
        if (child.model) meta.model = child.model;
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
      await this.conversations.remove(target.id);

      const state = await this.store.readState();
      await this.store.writeState({
        visitedIds: state.visitedIds.filter((visitedId) => visitedId !== target.id),
      });
      return { deleted: target, reattached };
    });
  }

  /** Walks a node and its ancestors for the nearest conversation sidecar. */
  private async walkConversation(nodeId: string, checkpoints: Checkpoint[]): Promise<ConversationState> {
    const byId = new Map(checkpoints.map((checkpoint) => [checkpoint.id, checkpoint]));
    let cursor = byId.get(nodeId);
    while (cursor) {
      const messages = await this.conversations.read(cursor.id);
      if (messages.length > 0) return { sourceId: cursor.id, messages };
      cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
    }
    return { sourceId: null, messages: [] };
  }

  /**
   * Ensures a store with a baseline exists and returns the current active checkpoint.
   * The origin baseline is created on first use; a missing active ref is healed to
   * the newest node. Caller must hold the mutex.
   */
  private async ensureBaselineLocked(): Promise<Checkpoint> {
    await this.store.ensure();
    const active = await this.getActiveCheckpoint();
    if (active) return active;
    const existing = await this.listCheckpoints();
    if (existing.length > 0) {
      await this.store.setActive(existing[0].oid);
      return existing[0];
    }
    return this.writeNode({
      type: "origin",
      title: "Origin",
      description: "Baseline snapshot taken when this workspace's checkpoint store was created.",
      parent: null,
    });
  }

  private async markVisited(id: string): Promise<void> {
    const state = await this.store.readState();
    if (!state.visitedIds.includes(id)) {
      await this.store.writeState({ visitedIds: [...state.visitedIds, id] });
    }
  }

  /** Resolves a workspace-relative path and refuses anything outside the workspace. */
  private resolveWorkspacePath(relativePath: string): string {
    const root = path.resolve(this.workspaceRoot);
    const resolved = path.resolve(root, relativePath);
    if (!resolved.startsWith(root + path.sep)) {
      throw new Error(`Refusing to write outside the workspace: ${relativePath}`);
    }
    return resolved;
  }

  /** Caller must hold the mutex. */
  private async writeNode(input: {
    type: CheckpointType;
    title?: string;
    description?: string;
    parent: Checkpoint | null;
    provider?: string;
    model?: string;
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
    if (input.provider) meta.provider = input.provider;
    if (input.model) meta.model = input.model;
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

function preview(text: string, maxLength: number): string {
  const single = collapseWhitespace(text);
  return single.length <= maxLength ? single : `${single.slice(0, maxLength - 1)}…`;
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
