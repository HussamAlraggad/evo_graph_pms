import { CHECKPOINT_TYPES, SCHEMA_VERSION, type CheckpointMeta, type CheckpointType } from "./types";

export const META_MARKER = "--- evograph-meta ---";

export class CheckpointDecodeError extends Error {
  readonly oid: string | undefined;

  constructor(message: string, oid?: string) {
    super(oid ? `${message} (commit ${oid})` : message);
    this.name = "CheckpointDecodeError";
    this.oid = oid;
  }
}

/**
 * Strips control characters (keeps \n and \t) so the message encoding stays parseable.
 * Applied to titles/descriptions both when building metadata and when encoding.
 */
export function sanitizeText(value: string): string {
  return value.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").trim();
}

export function encodeCheckpointMessage(meta: CheckpointMeta): string {
  const clean: CheckpointMeta = {
    ...meta,
    title: sanitizeText(meta.title),
    description: sanitizeText(meta.description),
  };
  return `${clean.title}\n\n${clean.description}\n\n${META_MARKER}\n${JSON.stringify(clean)}\n`;
}

export function decodeCheckpointMessage(message: string, oid?: string): CheckpointMeta {
  const markerIndex = message.indexOf(META_MARKER);
  if (markerIndex === -1) {
    throw new CheckpointDecodeError("checkpoint metadata marker not found in commit message", oid);
  }
  const raw = message.slice(markerIndex + META_MARKER.length).trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new CheckpointDecodeError(`checkpoint metadata is not valid JSON: ${detail}`, oid);
  }
  return validateMeta(parsed, oid);
}

function validateMeta(value: unknown, oid?: string): CheckpointMeta {
  if (typeof value !== "object" || value === null) {
    throw invalidMeta("not an object", oid);
  }
  const record = value as Record<string, unknown>;
  const schemaVersion = record.schemaVersion;
  const id = record.id;
  const type = record.type;
  const title = record.title;
  const description = record.description;
  const createdAt = record.createdAt;
  const parentId = record.parentId;
  const taskId = record.taskId;

  if (typeof schemaVersion !== "number") throw invalidMeta("schemaVersion is missing or not a number", oid);
  if (schemaVersion !== 1 && schemaVersion !== SCHEMA_VERSION) {
    throw invalidMeta(`unsupported schemaVersion ${String(schemaVersion)}`, oid);
  }
  if (typeof id !== "string" || id.length === 0) throw invalidMeta("id is missing", oid);
  if (typeof type !== "string" || !CHECKPOINT_TYPES.includes(type as CheckpointType)) {
    throw invalidMeta(`unknown checkpoint type ${String(type)}`, oid);
  }
  if (typeof title !== "string") throw invalidMeta("title is missing", oid);
  if (typeof description !== "string") throw invalidMeta("description is missing", oid);
  if (typeof createdAt !== "string") throw invalidMeta("createdAt is missing", oid);
  if (parentId !== null && typeof parentId !== "string") {
    throw invalidMeta("parentId must be a string or null", oid);
  }
  if (taskId !== undefined && typeof taskId !== "string") {
    throw invalidMeta("taskId must be a string when present", oid);
  }
  const provider = record.provider;
  const model = record.model;
  if (provider !== undefined && typeof provider !== "string") {
    throw invalidMeta("provider must be a string when present", oid);
  }
  if (model !== undefined && typeof model !== "string") {
    throw invalidMeta("model must be a string when present", oid);
  }

  const meta: CheckpointMeta = {
    schemaVersion,
    id,
    type: type as CheckpointType,
    title,
    description,
    createdAt,
    parentId,
  };
  if (typeof taskId === "string") meta.taskId = taskId;
  if (typeof provider === "string") meta.provider = provider;
  if (typeof model === "string") meta.model = model;
  return meta;
}

function invalidMeta(detail: string, oid?: string): CheckpointDecodeError {
  return new CheckpointDecodeError(`invalid checkpoint metadata: ${detail}`, oid);
}
