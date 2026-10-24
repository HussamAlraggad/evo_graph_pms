import * as vscode from "vscode";
import { registerCommands } from "./commands";
import { CheckpointEngine } from "./core/engine";
import { AssistantViewProvider } from "./ui/assistantView";
import { HistoryViewProvider } from "./ui/historyView";
import { StatusBarController } from "./ui/statusBar";

export function activate(context: vscode.ExtensionContext): void {
  // M0-M2 support single-root workspaces only; multi-root handling is deferred.
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  const engine = workspaceFolder ? new CheckpointEngine(workspaceFolder.uri.fsPath) : undefined;
  const statusBar = new StatusBarController(engine);
  const historyView = new HistoryViewProvider(context.extensionUri, engine, () => void refreshAll());
  const assistantView = new AssistantViewProvider(context, context.extensionUri, engine, () =>
    void refreshAll(),
  );

  async function refreshAll(): Promise<void> {
    await Promise.all([statusBar.refresh(), historyView.refresh(), assistantView.refresh()]);
  }

  context.subscriptions.push(
    statusBar,
    vscode.window.registerWebviewViewProvider(HistoryViewProvider.viewType, historyView),
    vscode.window.registerWebviewViewProvider(AssistantViewProvider.viewType, assistantView),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("evograph.assistant")) void refreshAll();
    }),
  );
  registerCommands(context, engine, refreshAll);
  void refreshAll();
}

export function deactivate(): void {
  // Nothing to clean up: disposables are registered in the extension context.
}
