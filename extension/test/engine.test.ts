import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CheckpointEngine } from "../src/core/engine";
import {
  createTempWorkspace,
  readWorkspaceFile,
  removeTempWorkspace,
  workspacePathExists,
  writeWorkspaceFile,
} from "./helpers";

describe("CheckpointEngine", () => {
  let root: string;
  let engine: CheckpointEngine;

  beforeEach(async () => {
    root = await createTempWorkspace();
    engine = new CheckpointEngine(root);
  });

  afterEach(async () => {
    await removeTempWorkspace(root);
  });

  it("creates an origin baseline plus the requested checkpoint on first use", async () => {
    await writeWorkspaceFile(root, "app.ts", "one");
    const created = await engine.createCheckpoint();
    const all = await engine.listCheckpoints();
    expect(all).toHaveLength(2);

    const origin = all.find((checkpoint) => checkpoint.type === "origin");
    expect(origin).toBeDefined();
    expect(origin?.parentId).toBeNull();
    expect(origin?.title).toBe("Origin");

    expect(created.type).toBe("manual");
    expect(created.parentId).toBe(origin?.id);
    expect(await engine.getActiveCheckpoint()).toMatchObject({ id: created.id });
  });

  it("generates heuristic titles and descriptions from changed files", async () => {
    await writeWorkspaceFile(root, "app.ts", "one");
    await engine.createCheckpoint();
    await writeWorkspaceFile(root, "app.ts", "two");
    const second = await engine.createCheckpoint();
    expect(second.title).toBe("Changed app.ts");
    expect(second.description).toContain("app.ts");
  });

  it("branches when a new checkpoint is created after switching to an earlier one", async () => {
    await writeWorkspaceFile(root, "app.ts", "v1");
    const first = await engine.createCheckpoint();
    await writeWorkspaceFile(root, "app.ts", "v2");
    const second = await engine.createCheckpoint();
    expect(second.parentId).toBe(first.id);

    const origin = (await engine.listCheckpoints()).find((checkpoint) => checkpoint.type === "origin");
    expect(origin).toBeDefined();
    const switched = await engine.switchToCheckpoint(origin!.id);
    expect(switched.safety).toBeNull();
    expect(await readWorkspaceFile(root, "app.ts")).toBe("v1");

    await writeWorkspaceFile(root, "app.ts", "v3-from-origin");
    const third = await engine.createCheckpoint();
    expect(third.parentId).toBe(origin!.id);

    const all = await engine.listCheckpoints();
    expect(all).toHaveLength(4);
    expect(all.map((checkpoint) => checkpoint.id)).toEqual(
      expect.arrayContaining([first.id, second.id, third.id]),
    );
  });

  it("switches cleanly and restores the workspace state", async () => {
    await writeWorkspaceFile(root, "app.ts", "original");
    const first = await engine.createCheckpoint();
    await writeWorkspaceFile(root, "app.ts", "edited");
    await writeWorkspaceFile(root, "added.ts", "added");
    await engine.createCheckpoint();

    const result = await engine.switchToCheckpoint(first.id);
    expect(result.safety).toBeNull();
    expect(await readWorkspaceFile(root, "app.ts")).toBe("original");
    expect(await workspacePathExists(root, "added.ts")).toBe(false);
    expect((await engine.getActiveCheckpoint())?.id).toBe(first.id);
  });

  it("auto-saves uncheckpointed changes as a safety checkpoint before switching", async () => {
    await writeWorkspaceFile(root, "app.ts", "original");
    const first = await engine.createCheckpoint();
    await writeWorkspaceFile(root, "app.ts", "edited");
    const second = await engine.createCheckpoint();
    await writeWorkspaceFile(root, "app.ts", "uncheckpointed work");

    const result = await engine.switchToCheckpoint(first.id);
    expect(result.safety).not.toBeNull();
    expect(result.safety?.title).toBe("Auto-save before switching");
    expect(result.safety?.parentId).toBe(second.id);
    expect(await readWorkspaceFile(root, "app.ts")).toBe("original");

    const all = await engine.listCheckpoints();
    expect(all.map((checkpoint) => checkpoint.id)).toContain(result.safety!.id);
    expect(all).toHaveLength(4);
  });

  it("auto-saves and discards when switching to the active checkpoint with edits", async () => {
    await writeWorkspaceFile(root, "app.ts", "v1");
    const first = await engine.createCheckpoint();
    await writeWorkspaceFile(root, "app.ts", "dirty edit");

    const result = await engine.switchToCheckpoint(first.id);
    expect(result.safety).not.toBeNull();
    expect(await readWorkspaceFile(root, "app.ts")).toBe("v1");
    expect((await engine.getActiveCheckpoint())?.id).toBe(first.id);
  });

  it("tracks visited checkpoints in the graph model", async () => {
    await writeWorkspaceFile(root, "app.ts", "v1");
    const first = await engine.createCheckpoint();
    await writeWorkspaceFile(root, "app.ts", "v2");
    const second = await engine.createCheckpoint();
    await engine.switchToCheckpoint(first.id);

    const model = await engine.getGraphModel();
    expect(model.checkpoints.map((checkpoint) => checkpoint.id)).toContain(first.id);
    expect(model.checkpoints.map((checkpoint) => checkpoint.id)).toContain(second.id);
    expect(model.activeId).toBe(first.id);
    expect(model.visitedIds).toEqual(expect.arrayContaining([first.id, second.id]));
  });

  it("deletes a checkpoint and reattaches its children to the parent", async () => {
    await writeWorkspaceFile(root, "app.ts", "v1");
    const first = await engine.createCheckpoint();
    await writeWorkspaceFile(root, "app.ts", "v2");
    const second = await engine.createCheckpoint();

    await engine.switchToCheckpoint(first.id);
    await writeWorkspaceFile(root, "app.ts", "branch-b");
    const third = await engine.createCheckpoint();
    expect(third.parentId).toBe(first.id);

    const origin = (await engine.listCheckpoints()).find((checkpoint) => checkpoint.type === "origin")!;
    const deletion = await engine.deleteCheckpoint(first.id);
    expect(deletion.deleted.id).toBe(first.id);
    expect(deletion.reattached.map((checkpoint) => checkpoint.id)).toEqual(
      expect.arrayContaining([second.id, third.id]),
    );

    const all = await engine.listCheckpoints();
    expect(all.map((checkpoint) => checkpoint.id)).not.toContain(first.id);
    expect(all.find((checkpoint) => checkpoint.id === second.id)?.parentId).toBe(origin.id);
    expect(all.find((checkpoint) => checkpoint.id === third.id)?.parentId).toBe(origin.id);

    const switched = await engine.switchToCheckpoint(second.id);
    expect(switched.safety).toBeNull();
    expect(await readWorkspaceFile(root, "app.ts")).toBe("v2");
  });

  it("moves the active pointer to the parent when the active checkpoint is deleted", async () => {
    await writeWorkspaceFile(root, "app.ts", "v1");
    const first = await engine.createCheckpoint();
    await writeWorkspaceFile(root, "app.ts", "v2");
    const second = await engine.createCheckpoint();

    await engine.deleteCheckpoint(second.id);
    expect((await engine.getActiveCheckpoint())?.id).toBe(first.id);
    expect(await readWorkspaceFile(root, "app.ts")).toBe("v2");
  });

  it("refuses to delete the origin checkpoint", async () => {
    await writeWorkspaceFile(root, "app.ts", "x");
    await engine.createCheckpoint();
    const origin = (await engine.listCheckpoints()).find((checkpoint) => checkpoint.type === "origin")!;
    await expect(engine.deleteCheckpoint(origin.id)).rejects.toThrow(/origin/i);
  });

  it("rejects switching to an unknown checkpoint", async () => {
    await writeWorkspaceFile(root, "app.ts", "x");
    await engine.createCheckpoint();
    await expect(engine.switchToCheckpoint("00000000-0000-4000-8000-000000000000")).rejects.toThrow(
      /Unknown checkpoint/,
    );
  });

  it("sorts checkpoints newest first and persists across engine instances", async () => {
    await writeWorkspaceFile(root, "app.ts", "1");
    await engine.createCheckpoint();
    await writeWorkspaceFile(root, "app.ts", "2");
    await engine.createCheckpoint();

    const reloadedEngine = new CheckpointEngine(root);
    const all = await reloadedEngine.listCheckpoints();
    expect(all).toHaveLength(3);
    expect(all[0].createdAt >= all[1].createdAt).toBe(true);
    expect(all[1].createdAt >= all[2].createdAt).toBe(true);
    expect((await reloadedEngine.getActiveCheckpoint())?.title).toBe("Changed app.ts");
  });
});
