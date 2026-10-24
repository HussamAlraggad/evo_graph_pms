import * as vscode from "vscode";
import { promptForApiKey } from "./ai/config";
import type { CheckpointEngine } from "./core/engine";
import { showError } from "./ui/errors";
import { checkpointTypeLabel, formatRelativeTime } from "./ui/format";
import { STATUS_MENU_COMMAND } from "./ui/statusBar";

const NO_WORKSPACE_MESSAGE = "EvoGraph requires an open folder workspace.";

interface StatusMenuPick extends vscode.QuickPickItem {
  run: () => void;
}

export function registerCommands(
  context: vscode.ExtensionContext,
  engine: CheckpointEngine | undefined,
  refresh: () => Promise<void>,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("evograph.createCheckpoint", () => createCheckpoint(engine, refresh)),
    vscode.commands.registerCommand("evograph.switchCheckpoint", () => switchCheckpoint(engine, refresh)),
    vscode.commands.registerCommand("evograph.openGraph", () => openGraph()),
    vscode.commands.registerCommand(STATUS_MENU_COMMAND, () => showStatusMenu(engine)),
    vscode.commands.registerCommand("evograph.setAssistantApiKey", async () => {
      await promptForApiKey(context);
      await refresh();
    }),
  );
}

async function openGraph(): Promise<void> {
  try {
    await vscode.commands.executeCommand("evograph.history.focus");
  } catch (error) {
    showError("open the checkpoint file", error);
  }
}

async function createCheckpoint(
  engine: CheckpointEngine | undefined,
  refresh: () => Promise<void>,
): Promise<void> {
  if (!engine) {
    void vscode.window.showErrorMessage(NO_WORKSPACE_MESSAGE);
    return;
  }
  try {
    const checkpoint = await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Window, title: "EvoGraph: creating checkpoint" },
      () => engine.createCheckpoint(),
    );
    await refresh();
    void vscode.window.showInformationMessage(`EvoGraph: checkpoint created — ${checkpoint.title}`);
  } catch (error) {
    showError("create a checkpoint", error);
  }
}

async function switchCheckpoint(
  engine: CheckpointEngine | undefined,
  refresh: () => Promise<void>,
): Promise<void> {
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
      title: "Switch to checkpoint",
      placeHolder: "Select a checkpoint to switch to",
    });
    if (!picked) return;

    const result = await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Window, title: "EvoGraph: switching checkpoint" },
      () => engine.switchToCheckpoint(picked.checkpoint.id),
    );
    await refresh();
    if (result.safety) {
      vscode.window.setStatusBarMessage("EvoGraph: saved a safety checkpoint before switching", 4000);
    }
  } catch (error) {
    showError("switch checkpoints", error);
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
      label: "$(history) Switch to checkpoint…",
      run: () => void vscode.commands.executeCommand("evograph.switchCheckpoint"),
    },
    {
      label: "$(map) Open checkpoint file",
      run: () => void vscode.commands.executeCommand("evograph.openGraph"),
    },
    {
      label: "$(key) Set assistant API key…",
      run: () => void vscode.commands.executeCommand("evograph.setAssistantApiKey"),
    },
  ];
  const picked = await vscode.window.showQuickPick(picks, { title: "EvoGraph" });
  if (picked) picked.run();
}
