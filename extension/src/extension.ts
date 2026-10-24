import * as vscode from "vscode";
import { registerCommands } from "./commands";
import { CheckpointEngine } from "./core/engine";
import { StatusBarController } from "./ui/statusBar";

export function activate(context: vscode.ExtensionContext): void {
  // M0 supports single-root workspaces only; multi-root handling is deferred.
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  const engine = workspaceFolder ? new CheckpointEngine(workspaceFolder.uri.fsPath) : undefined;
  const statusBar = new StatusBarController(engine);
  context.subscriptions.push(statusBar);
  registerCommands(context, engine, statusBar);
  void statusBar.refresh();
}

export function deactivate(): void {
  // Nothing to clean up: the status bar item is disposed via context subscriptions.
}
