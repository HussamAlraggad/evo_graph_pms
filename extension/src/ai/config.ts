import * as vscode from "vscode";
import { OpenAICompatibleProvider } from "./openaiCompatible";
import type { AssistantProvider } from "./provider";

export const API_KEY_SECRET = "evograph.assistant.apiKey";
export const DEFAULT_BASE_URL = "https://api.openai.com/v1";
export const DEFAULT_MODEL = "gpt-4o-mini";

const CONFIG_SECTION = "evograph.assistant";

export interface AssistantConfig {
  baseUrl: string;
  model: string;
}

export function readAssistantConfig(): AssistantConfig {
  const settings = vscode.workspace.getConfiguration(CONFIG_SECTION);
  const baseUrl = (settings.get<string>("baseUrl") ?? "").trim() || DEFAULT_BASE_URL;
  const model = (settings.get<string>("model") ?? "").trim() || DEFAULT_MODEL;
  return { baseUrl, model };
}

/** The live provider, or null when no API key is stored yet. */
export async function getAssistantProvider(
  context: vscode.ExtensionContext,
): Promise<AssistantProvider | null> {
  const apiKey = await context.secrets.get(API_KEY_SECRET);
  if (!apiKey) return null;
  const { baseUrl, model } = readAssistantConfig();
  return new OpenAICompatibleProvider({ baseUrl, apiKey, model });
}

/**
 * Stores the endpoint's API key in VS Code's secret storage. Submitting an empty
 * value removes the key; cancelling changes nothing.
 */
export async function promptForApiKey(context: vscode.ExtensionContext): Promise<void> {
  const existing = await context.secrets.get(API_KEY_SECRET);
  const value = await vscode.window.showInputBox({
    title: existing ? "Replace assistant API key" : "Set assistant API key",
    prompt: "Key for the OpenAI-compatible endpoint. Stored in VS Code's secret storage, never in settings.",
    placeHolder: "sk-…",
    password: true,
    ignoreFocusOut: true,
  });
  if (value === undefined) return;
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    if (existing) {
      await context.secrets.delete(API_KEY_SECRET);
      void vscode.window.showInformationMessage("EvoGraph: assistant API key removed.");
    }
    return;
  }
  await context.secrets.store(API_KEY_SECRET, trimmed);
  void vscode.window.showInformationMessage("EvoGraph: assistant API key saved.");
}
