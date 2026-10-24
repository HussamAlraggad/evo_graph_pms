import * as vscode from "vscode";
import { parseContent } from "../ai/blocks";
import { getAssistantProvider, readAssistantConfig } from "../ai/config";
import { AssistantRequestError } from "../ai/openaiCompatible";
import type { ChatMessage } from "../core/conversations";
import type { CheckpointEngine } from "../core/engine";
import { showError } from "./errors";
import { checkpointTypeLabel } from "./format";
import { createNonce } from "./nonce";

interface WebviewMessage {
  type: string;
  text?: unknown;
  nodeId?: unknown;
  blockId?: unknown;
}

function isWebviewMessage(value: unknown): value is WebviewMessage {
  return typeof value === "object" && value !== null && typeof (value as { type?: unknown }).type === "string";
}

interface RenderedProsePart {
  kind: "prose";
  text: string;
}

interface RenderedCodePart {
  kind: "code";
  language: string | null;
  file: string | null;
  code: string;
  blockId: string;
}

type RenderedPart = RenderedProsePart | RenderedCodePart;

interface RenderedMessage {
  role: "user" | "assistant";
  createdAt: string;
  parts: RenderedPart[];
}

type AssistantPanelState =
  | { kind: "no-workspace" }
  | { kind: "no-key"; provider: string; model: string }
  | {
      kind: "ready";
      provider: string;
      model: string;
      activeId: string | null;
      /** The node whose conversation is shown; Apply attaches here. */
      nodeId: string | null;
      carriedFrom: { type: string; label: string; time: string; title: string } | null;
      messages: RenderedMessage[];
    };

const PROVIDER_ID = "openai-compatible";

export class AssistantViewProvider implements vscode.WebviewViewProvider {
  static readonly viewType = "evograph.assistant";

  private view: vscode.WebviewView | undefined;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly extensionUri: vscode.Uri,
    private readonly engine: CheckpointEngine | undefined,
    private readonly onDidMutate: () => void,
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "media")],
    };
    webviewView.webview.html = this.buildHtml(webviewView.webview);
    webviewView.webview.onDidReceiveMessage((message) => void this.handleMessage(message));
    webviewView.onDidDispose(() => {
      this.view = undefined;
    });
  }

  async refresh(): Promise<void> {
    const webview = this.view?.webview;
    if (!webview) return;
    try {
      await webview.postMessage({ type: "state", state: await this.buildState() });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await webview.postMessage({ type: "state-error", message });
    }
  }

  private async buildState(): Promise<AssistantPanelState> {
    const engine = this.engine;
    if (!engine) return { kind: "no-workspace" };

    const { model } = readAssistantConfig();
    const provider = await getAssistantProvider(this.context);
    if (!provider) return { kind: "no-key", provider: PROVIDER_ID, model };

    const active = await engine.getActiveCheckpoint();
    if (!active) {
      return {
        kind: "ready",
        provider: provider.id,
        model: provider.model,
        activeId: null,
        nodeId: null,
        carriedFrom: null,
        messages: [],
      };
    }

    const [conversation, checkpoints] = await Promise.all([
      engine.getConversation(active.id),
      engine.listCheckpoints(),
    ]);
    const source = conversation.sourceId
      ? checkpoints.find((checkpoint) => checkpoint.id === conversation.sourceId)
      : undefined;
    const carriedFrom =
      source && source.id !== active.id
        ? {
            type: source.type,
            label: checkpointTypeLabel(source.type),
            time: timeOf(source.createdAt),
            title: source.title,
          }
        : null;

    return {
      kind: "ready",
      provider: provider.id,
      model: provider.model,
      activeId: active.id,
      nodeId: conversation.sourceId ?? active.id,
      carriedFrom,
      messages: conversation.messages.map((message, index) => ({
        role: message.role,
        createdAt: message.createdAt,
        parts: toParts(message, index),
      })),
    };
  }

  private async handleMessage(message: unknown): Promise<void> {
    if (!isWebviewMessage(message)) return;
    switch (message.type) {
      case "ready":
        await this.refresh();
        break;
      case "send":
        await this.handleSend(message.text);
        break;
      case "apply":
        await this.handleApply(message.nodeId, message.blockId);
        break;
      case "set-key":
        await vscode.commands.executeCommand("evograph.setAssistantApiKey");
        break;
      default:
        break;
    }
  }

  private async handleSend(text: unknown): Promise<void> {
    const engine = this.engine;
    const webview = this.view?.webview;
    if (!engine || !webview || typeof text !== "string") return;
    const trimmed = text.trim();
    if (trimmed.length === 0) return;
    const provider = await getAssistantProvider(this.context);
    if (!provider) {
      await this.refresh();
      return;
    }
    try {
      await engine.sendPrompt(trimmed, provider);
      this.onDidMutate();
      await this.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const recovery =
        error instanceof AssistantRequestError && (error.status === 401 || error.status === 403)
          ? "set-key"
          : "retry";
      await webview.postMessage({ type: "error", message, recovery });
    }
  }

  private async handleApply(rawNodeId: unknown, rawBlockId: unknown): Promise<void> {
    const engine = this.engine;
    if (!engine || typeof rawNodeId !== "string" || typeof rawBlockId !== "string") return;
    try {
      const conversation = await engine.getConversation(rawNodeId);
      const block = conversation.messages
        .flatMap((message, index) => toParts(message, index))
        .find((part) => part.kind === "code" && part.blockId === rawBlockId);
      if (!block || block.kind !== "code") {
        throw new Error(`The code block is no longer in this conversation: ${rawBlockId}`);
      }
      if (!block.file) throw new Error("This code block does not name a target file.");
      const target = block.file;

      const source = (await engine.listCheckpoints()).find((checkpoint) => checkpoint.id === rawNodeId);
      const confirmation = await vscode.window.showWarningMessage(
        `Apply the AI change to ${target}? The file's contents are replaced, and an AI-applied checkpoint records the result.`,
        { modal: true },
        "Apply",
      );
      if (confirmation !== "Apply") return;

      const applied = await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Window, title: `EvoGraph: applying the AI change to ${target}` },
        () =>
          engine.applyCodeBlock({
            nodeId: rawNodeId,
            file: target,
            content: block.code,
            provider: source?.provider,
            model: source?.model,
          }),
      );
      this.onDidMutate();
      await this.refresh();
      vscode.window.setStatusBarMessage(
        applied.safety
          ? `EvoGraph: saved uncheckpointed work and applied the AI change to ${target}`
          : `EvoGraph: applied the AI change to ${target}`,
        5000,
      );
    } catch (error) {
      showError("apply an AI change", error);
    }
  }

  private buildHtml(webview: vscode.Webview): string {
    const nonce = createNonce();
    const sheetStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "media", "sheet.css"));
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "media", "assistant.css"),
    );
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "media", "assistant.js"));
    const csp = [
      "default-src 'none'",
      `style-src ${webview.cspSource}`,
      `script-src 'nonce-${nonce}'`,
      `img-src ${webview.cspSource} data:`,
      `font-src ${webview.cspSource}`,
    ].join("; ");
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="${sheetStyleUri}">
<link rel="stylesheet" href="${styleUri}">
<title>Assistant</title>
</head>
<body>
<div id="root" class="sheet"></div>
<script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function toParts(message: ChatMessage, messageIndex: number): RenderedPart[] {
  return parseContent(message.content).map((block, partIndex) => {
    if (block.kind === "prose") return { kind: "prose", text: block.text };
    return {
      kind: "code",
      language: block.language,
      file: block.file,
      code: block.code,
      blockId: `${messageIndex}-${partIndex}`,
    };
  });
}

function timeOf(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toTimeString().slice(0, 5);
}
