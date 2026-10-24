import * as vscode from "vscode";
import type { CheckpointEngine } from "./core/engine";
import { checkpointTypeLabel, formatRelativeTime } from "./ui/format";
import { STATUS_MENU_COMMAND, type StatusBarController } from "./ui/statusBar";

const NO_WORKSPACE_MESSAGE = "EvoGraph requires an open folder workspace.";

interface StatusMenuPick extends vscode.QuickPickItem {
  run: () => void;
}

export function registerCommands(
  context: vscode.ExtensionContext,
  engine: CheckpointEngine | undefined,
  statusBar: StatusBarController,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("evograph.createCheckpoint", () => createCheckpoint(engine, statusBar)),
    vscode.commands.registerCommand("evograph.restoreCheckpoint", () => restoreCheckpoint(engine, statusBar)),
    vscode.commands.registerCommand(STATUS_MENU_COMMAND, () => showStatusMenu(engine)),
  );
}

async function createCheckpoint(engine: CheckpointEngine | undefined, statusBar: StatusBarController): Promise<void> {
  if (!engine) {
    void vscode.window.showErrorMessage(NO_WORKSPACE_MESSAGE);
    return;
  }
  try {
    const checkpoint = await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Window, title: "EvoGraph: creating checkpoint" },
      () => engine.createCheckpoint(),
    );
    await statusBar.refresh();
    void vscode.window.showInformationMessage(`EvoGraph: checkpoint created — ${checkpoint.title}`);
  } catch (error) {
    showCommandError("create a checkpoint", error);
  }
}

async function restoreCheckpoint(engine: CheckpointEngine | undefined, statusBar: StatusBarController): Promise<void> {
  if (!engine) {
    void vscode.window.showErrorMessage(NO_WORKSPACE_MESSAGE);
    return;
  }
  try {
    const checkpoints = await engine.listCheckpoints();
    if (checkpoints.length === 0) {
      void vscode.window.showInformationMessage("EvoGraph: no checkpoints yet. Create one first.");
      return;
    }
    const active = await engine.getActiveCheckpoint();
    const picks = checkpoints.map((checkpoint) => ({
      label: checkpoint.title,
      description: `${checkpointTypeLabel(checkpoint.type)} · ${formatRelativeTime(checkpoint.createdAt)}${
        checkpoint.id === active?.id ? " · active" : ""
      }`,
      detail: `id ${checkpoint.id}`,
      checkpoint,
    }));
    const picked = await vscode.window.showQuickPick(picks, {
      title: "Restore checkpoint",
      placeHolder: "Select a checkpoint to restore",
    });
    if (!picked) return;

    const confirmation = await vscode.window.showWarningMessage(
      `Restore "${picked.checkpoint.title}"? Uncheckpointed changes in the workspace will be replaced.`,
      { modal: true },
      "Restore",
    );
    if (confirmation !== "Restore") return;

    const restored = await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Window, title: "EvoGraph: restoring checkpoint" },
      () => engine.restoreCheckpoint(picked.checkpoint.id),
    );
    await statusBar.refresh();
    void vscode.window.showInformationMessage(`EvoGraph: restored checkpoint — ${restored.title}`);
  } catch (error) {
    showCommandError("restore a checkpoint", error);
  }
}

async function showStatusMenu(engine: CheckpointEngine | undefined): Promise<void> {
  if (!engine) {
    void vscode.window.showErrorMessage(NO_WORKSPACE_MESSAGE);
    return;
  }
  const picks: StatusMenuPick[] = [
    {
      label: "$(add) Create checkpoint",
      run: () => void vscode.commands.executeCommand("evograph.createCheckpoint"),
    },
    {
      label: "$(history) Restore checkpoint…",
      run: () => void vscode.commands.executeCommand("evograph.restoreCheckpoint"),
    },
  ];
  const picked = await vscode.window.showQuickPick(picks, { title: "EvoGraph" });
  if (picked) picked.run();
}

function showCommandError(action: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`EvoGraph: failed to ${action}`, error);
  void vscode.window.showErrorMessage(`EvoGraph: failed to ${action}: ${message}`);
}
