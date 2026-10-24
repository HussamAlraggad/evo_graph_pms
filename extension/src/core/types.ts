export const SCHEMA_VERSION = 1;

export type CheckpointType = "origin" | "manual" | "ai_prompt" | "ai_applied";

export const CHECKPOINT_TYPES: readonly CheckpointType[] = ["origin", "manual", "ai_prompt", "ai_applied"];

/**
 * Immutable facts about a checkpoint, stored in the checkpoint commit message.
 * `taskId` is reserved for task linking (M3); absence is normal and valid.
 */
export interface CheckpointMeta {
  schemaVersion: number;
  id: string;
  type: CheckpointType;
  title: string;
  description: string;
  createdAt: string;
  parentId: string | null;
  taskId?: string;
}

/** A checkpoint as exposed to the rest of the extension (metadata + snapshot commit). */
export interface Checkpoint extends CheckpointMeta {
  oid: string;
}
