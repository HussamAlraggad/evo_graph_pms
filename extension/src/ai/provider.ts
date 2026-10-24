import type { ChatMessage } from "../core/conversations";

export interface AssistantReply {
  content: string;
  provider: string;
  model: string;
}

/** Pluggable assistant backend. M2 ships the OpenAI-compatible implementation. */
export interface AssistantProvider {
  readonly id: string;
  readonly model: string;
  chat(messages: ChatMessage[]): Promise<AssistantReply>;
}

/**
 * The convention that makes "Apply" possible: proposed code changes arrive as
 * fenced blocks whose info string names the target file (`file:<path>`).
 */
export const ASSISTANT_SYSTEM_PROMPT = [
  "You are the assistant inside a checkpointed coding workspace.",
  "Be concise and concrete. When you propose code changes, present each change as a fenced",
  "code block whose info string names its target file, for example:",
  "",
  "```ts file:src/example.ts",
  "// full replacement contents",
  "```",
  "",
  "Use paths relative to the workspace root and give the full replacement contents of the file.",
  "If no single file applies, omit the file: tag.",
].join("\n");
