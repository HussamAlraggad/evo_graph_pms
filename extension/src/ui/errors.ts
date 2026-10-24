import * as vscode from "vscode";

export function showError(action: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`EvoGraph: failed to ${action}`, error);
  void vscode.window.showErrorMessage(`EvoGraph: failed to ${action}: ${message}`);
}
