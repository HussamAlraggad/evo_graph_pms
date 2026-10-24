import type { ChatMessage } from "../core/conversations";
import { ASSISTANT_SYSTEM_PROMPT, type AssistantProvider, type AssistantReply } from "./provider";

export interface OpenAICompatibleConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 90_000;

/** A request the endpoint answered with a non-2xx status. */
export class AssistantRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AssistantRequestError";
  }
}

/**
 * Minimal streaming-free client for any OpenAI-compatible chat-completions endpoint
 * (OpenAI, OpenRouter, local Ollama/LM Studio, ...).
 */
export class OpenAICompatibleProvider implements AssistantProvider {
  readonly id = "openai-compatible";
  readonly model: string;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(config: OpenAICompatibleConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async chat(messages: ChatMessage[]): Promise<AssistantReply> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: ASSISTANT_SYSTEM_PROMPT },
            ...messages.map((message) => ({ role: message.role, content: message.content })),
          ],
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new AssistantRequestError(
          `Assistant request failed (HTTP ${response.status}): ${body.slice(0, 300)}`,
          response.status,
        );
      }
      return { content: extractContent(await response.json()), provider: this.id, model: this.model };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Assistant request timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}

function extractContent(payload: unknown): string {
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new Error("Assistant response contained no choices");
  }
  const message = (choices[0] as { message?: unknown }).message;
  const content = (message as { content?: unknown } | undefined)?.content;
  if (typeof content !== "string" || content.length === 0) {
    throw new Error("Assistant response contained no message content");
  }
  return content;
}
