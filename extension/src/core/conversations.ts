import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface ConversationFile {
  schemaVersion: number;
  messages: ChatMessage[];
}

const CONVERSATION_SCHEMA_VERSION = 1;
const CHECKPOINT_ID_PATTERN = /^[0-9a-fA-F-]{1,64}$/;

/**
 * Per-checkpoint conversation snapshots ("AI interaction state"), stored as
 * sidecars under <workspace>/.evograph/chat/<checkpointId>.json. A node without
 * a sidecar restores to the nearest ancestor that has one (resolved in the engine).
 */
export class ConversationStore {
  constructor(private readonly workspaceRoot: string) {}

  get chatDir(): string {
    return path.join(this.workspaceRoot, ".evograph", "chat");
  }

  async read(checkpointId: string): Promise<ChatMessage[]> {
    this.assertValidId(checkpointId);
    try {
      const raw = await fs.readFile(this.filePath(checkpointId), "utf8");
      return parseConversation(JSON.parse(raw), checkpointId);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  async write(checkpointId: string, messages: ChatMessage[]): Promise<void> {
    this.assertValidId(checkpointId);
    await fs.mkdir(this.chatDir, { recursive: true });
    const file: ConversationFile = { schemaVersion: CONVERSATION_SCHEMA_VERSION, messages };
    const temporaryPath = `${this.filePath(checkpointId)}.tmp`;
    await fs.writeFile(temporaryPath, JSON.stringify(file), "utf8");
    await fs.rename(temporaryPath, this.filePath(checkpointId));
  }

  async remove(checkpointId: string): Promise<void> {
    this.assertValidId(checkpointId);
    await fs.rm(this.filePath(checkpointId), { force: true });
  }

  private filePath(checkpointId: string): string {
    return path.join(this.chatDir, `${checkpointId}.json`);
  }

  private assertValidId(checkpointId: string): void {
    if (!CHECKPOINT_ID_PATTERN.test(checkpointId)) {
      throw new Error(`Invalid checkpoint id for a conversation sidecar: ${checkpointId}`);
    }
  }
}

function parseConversation(value: unknown, checkpointId: string): ChatMessage[] {
  if (typeof value !== "object" || value === null) {
    throw new Error(`Invalid conversation sidecar for ${checkpointId}: not an object`);
  }
  const record = value as { schemaVersion?: unknown; messages?: unknown };
  if (record.schemaVersion !== CONVERSATION_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported conversation sidecar version for ${checkpointId}: ${String(record.schemaVersion)}`,
    );
  }
  if (!Array.isArray(record.messages)) {
    throw new Error(`Invalid conversation sidecar for ${checkpointId}: messages is not an array`);
  }
  return record.messages.map((message, index) => {
    if (typeof message !== "object" || message === null) {
      throw new Error(`Invalid message ${index} in conversation sidecar for ${checkpointId}`);
    }
    const entry = message as { role?: unknown; content?: unknown; createdAt?: unknown };
    if (entry.role !== "user" && entry.role !== "assistant") {
      throw new Error(`Invalid message role in conversation sidecar for ${checkpointId}`);
    }
    if (typeof entry.content !== "string" || typeof entry.createdAt !== "string") {
      throw new Error(`Invalid message fields in conversation sidecar for ${checkpointId}`);
    }
    return { role: entry.role, content: entry.content, createdAt: entry.createdAt };
  });
}
