import * as vscode from "vscode";
import type { CheckpointEngine } from "../core/engine";

export const STATUS_MENU_COMMAND = "evograph.statusMenu";

const MAX_TITLE_LENGTH = 40;

export class StatusBarController implements vscode.Disposable {
  private readonly item: vscode.StatusBarItem;

  constructor(private readonly engine: CheckpointEngine | undefined) {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 40);
    this.item.name = "EvoGraph";
    this.item.command = STATUS_MENU_COMMAND;
    this.item.show();
  }

  dispose(): void {
    this.item.dispose();
  }

  async refresh(): Promise<void> {
    if (!this.engine) {
      this.item.text = "$(git-commit) EvoGraph: no folder";
      this.item.tooltip = "Open a folder to use EvoGraph checkpoints.";
      return;
    }
    try {
      const active = await this.engine.getActiveCheckpoint();
      if (active) {
        this.item.text = `$(git-commit) ${truncate(active.title, MAX_TITLE_LENGTH)}`;
        this.item.tooltip = `Active checkpoint: ${active.title}\nClick for checkpoint actions.`;
      } else {
        this.item.text = "$(git-commit) EvoGraph: no checkpoints";
        this.item.tooltip = "No checkpoints yet. Click to create the first one.";
      }
    } catch (error) {
      console.error("EvoGraph: status bar refresh failed", error);
      this.item.text = "$(warning) EvoGraph";
      this.item.tooltip = `EvoGraph: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
}
