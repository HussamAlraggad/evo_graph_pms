import * as vscode from "vscode";
import { registerCommands } from "./commands";
import { CheckpointEngine } from "./core/engine";
import { HistoryViewProvider } from "./ui/historyView";
import { StatusBarController } from "./ui/statusBar";

export function activate(context: vscode.ExtensionContext): void {
  // M0-M1 supports single-root workspaces only; multi-root handling is deferred.
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  const engine = workspaceFolder ? new CheckpointEngine(workspaceFolder.uri.fsPath) : undefined;
  const statusBar = new StatusBarController(engine);
  const historyView = new HistoryViewProvider(context.extensionUri, engine, () => {
    void statusBar.refresh();
  });

  context.subscriptions.push(
    statusBar,
    vscode.window.registerWebviewViewProvider(HistoryViewProvider.viewType, historyView),
  );
  registerCommands(context, engine, statusBar, () => historyView.refresh());
  void statusBar.refresh();
}

export function deactivate(): void {
  // Nothing to clean up: disposables are registered in the extension context.
}
