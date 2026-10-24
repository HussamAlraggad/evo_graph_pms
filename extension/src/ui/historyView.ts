import * as vscode from "vscode";
import type { CheckpointEngine } from "../core/engine";
import { showError } from "./errors";

interface WebviewMessage {
  type: string;
  id?: unknown;
}

function isWebviewMessage(value: unknown): value is WebviewMessage {
  return typeof value === "object" && value !== null && typeof (value as { type?: unknown }).type === "string";
}

export class HistoryViewProvider implements vscode.WebviewViewProvider {
  static readonly viewType = "evograph.history";

  private view: vscode.WebviewView | undefined;

  constructor(
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
    const engine = this.engine;
    if (!engine) {
      await webview.postMessage({ type: "no-workspace" });
      return;
    }
    try {
      const model = await engine.getGraphModel();
      await webview.postMessage({ type: "graph", model });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await webview.postMessage({ type: "graph-error", message });
    }
  }

  private async handleMessage(message: unknown): Promise<void> {
    if (!isWebviewMessage(message)) return;
    switch (message.type) {
      case "ready":
        await this.refresh();
        break;
      case "create":
        await vscode.commands.executeCommand("evograph.createCheckpoint");
        break;
      case "switch":
        await this.handleSwitch(message.id);
        break;
      case "delete":
        await this.handleDelete(message.id);
        break;
      default:
        break;
    }
  }

  private async handleSwitch(id: unknown): Promise<void> {
    const engine = this.engine;
    if (!engine || typeof id !== "string") return;
    try {
      const result = await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Window, title: "EvoGraph: switching checkpoint" },
        () => engine.switchToCheckpoint(id),
      );
      if (result.safety) {
        vscode.window.setStatusBarMessage("EvoGraph: saved a safety checkpoint before switching", 4000);
      }
      this.onDidMutate();
      await this.refresh();
    } catch (error) {
      showError("switch checkpoints", error);
      await this.refresh();
    }
  }

  private async handleDelete(id: unknown): Promise<void> {
    const engine = this.engine;
    if (!engine || typeof id !== "string") return;
    try {
      const checkpoints = await engine.listCheckpoints();
      const target = checkpoints.find((checkpoint) => checkpoint.id === id);
      if (!target) throw new Error(`Unknown checkpoint: ${id}`);
      if (target.type === "origin") {
        void vscode.window.showInformationMessage("EvoGraph: the origin checkpoint cannot be deleted.");
        return;
      }
      const parent = checkpoints.find((checkpoint) => checkpoint.id === target.parentId);
      const childCount = checkpoints.filter((checkpoint) => checkpoint.parentId === id).length;
      const detail =
        childCount === 0
          ? "Its snapshot is removed from the file."
          : `${childCount} child checkpoint${childCount === 1 ? "" : "s"} will reattach to "${parent?.title ?? "the parent"}".`;
      const confirmation = await vscode.window.showWarningMessage(
        `Delete "${target.title}"? ${detail}`,
        { modal: true },
        "Delete",
      );
      if (confirmation !== "Delete") return;

      await engine.deleteCheckpoint(id);
      this.onDidMutate();
      await this.refresh();
    } catch (error) {
      showError("delete a checkpoint", error);
    }
  }

  private buildHtml(webview: vscode.Webview): string {
    const nonce = createNonce();
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "media", "view.css"));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "media", "graph.js"));
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
<link rel="stylesheet" href="${styleUri}">
<title>Checkpoint File</title>
</head>
<body>
<div id="root" class="sheet"></div>
<script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function createNonce(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";
  for (let index = 0; index < 32; index += 1) {
    nonce += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return nonce;
}
