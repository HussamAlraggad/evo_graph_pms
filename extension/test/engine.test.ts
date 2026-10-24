import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AssistantProvider, AssistantReply } from "../src/ai/provider";
import type { ChatMessage } from "../src/core/conversations";
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

class FakeProvider implements AssistantProvider {
  readonly id = "fake";
  readonly model = "fake-model-1";
  lastMessages: ChatMessage[] = [];

  constructor(
    private readonly replyText: string,
    private readonly fail = false,
  ) {}

  async chat(messages: ChatMessage[]): Promise<AssistantReply> {
    this.lastMessages = messages;
    if (this.fail) throw new Error("provider exploded");
    return { content: this.replyText, provider: this.id, model: this.model };
  }
}

describe("CheckpointEngine assistant operations", () => {
  let root: string;
  let engine: CheckpointEngine;

  beforeEach(async () => {
    root = await createTempWorkspace();
    engine = new CheckpointEngine(root);
  });

  afterEach(async () => {
    await removeTempWorkspace(root);
  });

  it("sendPrompt creates an origin baseline and an AI prompt checkpoint with a conversation sidecar", async () => {
    await writeWorkspaceFile(root, "app.ts", "one");
    const provider = new FakeProvider("Try this change.");
    const result = await engine.sendPrompt("Fix the race condition", provider);

    const all = await engine.listCheckpoints();
    expect(all).toHaveLength(2);
    const origin = all.find((checkpoint) => checkpoint.type === "origin");
    expect(origin).toBeDefined();

    expect(result.promptCheckpoint.type).toBe("ai_prompt");
    expect(result.promptCheckpoint.parentId).toBe(origin?.id);
    expect(result.promptCheckpoint.provider).toBe("fake");
    expect(result.promptCheckpoint.model).toBe("fake-model-1");
    expect(result.promptCheckpoint.title).toBe("Prompt: Fix the race condition");

    const conversation = await engine.getConversation(result.promptCheckpoint.id);
    expect(conversation.sourceId).toBe(result.promptCheckpoint.id);
    expect(conversation.messages).toHaveLength(2);
    expect(conversation.messages[0].role).toBe("user");
    expect(conversation.messages[0].content).toBe("Fix the race condition");
    expect(conversation.messages[1].role).toBe("assistant");
    expect(conversation.messages[1].content).toBe("Try this change.");
  });

  it("sendPrompt chains follow-up exchanges and passes history to the provider", async () => {
    const first = await engine.sendPrompt("first question", new FakeProvider("first reply"));
    const followUp = new FakeProvider("second reply");
    const second = await engine.sendPrompt("follow up", followUp);

    expect(second.promptCheckpoint.parentId).toBe(first.promptCheckpoint.id);
    expect(followUp.lastMessages).toHaveLength(3);
    expect(followUp.lastMessages.map((message) => message.content)).toEqual([
      "first question",
      "first reply",
      "follow up",
    ]);

    const conversation = await engine.getConversation(second.promptCheckpoint.id);
    expect(conversation.messages.map((message) => message.content)).toEqual([
      "first question",
      "first reply",
      "follow up",
      "second reply",
    ]);
  });

  it("editing an earlier prompt branches from that checkpoint", async () => {
    const first = await engine.sendPrompt("first question", new FakeProvider("first reply"));
    await engine.sendPrompt("second question", new FakeProvider("second reply"));

    const switched = await engine.switchToCheckpoint(first.promptCheckpoint.id);
    expect(switched.safety).toBeNull();

    const resumed = await engine.sendPrompt("edited second question", new FakeProvider("second reply v2"));
    expect(resumed.promptCheckpoint.parentId).toBe(first.promptCheckpoint.id);

    const all = await engine.listCheckpoints();
    expect(all).toHaveLength(4); // origin, first, second, resumed
    const branched = await engine.getConversation(resumed.promptCheckpoint.id);
    expect(branched.messages.map((message) => message.content)).toEqual([
      "first question",
      "first reply",
      "edited second question",
      "second reply v2",
    ]);
  });

  it("a failed provider call leaves no AI checkpoint behind", async () => {
    await expect(engine.sendPrompt("boom", new FakeProvider("", true))).rejects.toThrow(/provider exploded/);
    const all = await engine.listCheckpoints();
    expect(all).toHaveLength(1);
    expect(all[0].type).toBe("origin");
  });

  it("applyCodeBlock writes the file and records an AI-applied node on the active line", async () => {
    const sent = await engine.sendPrompt("write the patch", new FakeProvider("ok"));
    const applied = await engine.applyCodeBlock({
      nodeId: sent.promptCheckpoint.id,
      file: "src/patch.ts",
      content: "export const x = 1;\n",
      provider: "fake",
      model: "fake-model-1",
    });

    expect(await readWorkspaceFile(root, "src/patch.ts")).toBe("export const x = 1;\n");
    expect(applied.checkpoint.type).toBe("ai_applied");
    expect(applied.checkpoint.parentId).toBe(sent.promptCheckpoint.id);
    expect(applied.checkpoint.provider).toBe("fake");
    expect(applied.safety).toBeNull();
  });

  it("applyCodeBlock auto-saves uncheckpointed work before writing", async () => {
    const sent = await engine.sendPrompt("more", new FakeProvider("ok"));
    await writeWorkspaceFile(root, "app.ts", "uncheckpointed edit");

    const applied = await engine.applyCodeBlock({
      nodeId: sent.promptCheckpoint.id,
      file: "src/another.ts",
      content: "y\n",
      provider: "fake",
      model: "fake-model-1",
    });

    expect(applied.safety).not.toBeNull();
    expect(applied.safety?.title).toBe("Auto-save before applying");
    expect(applied.safety?.parentId).toBe(sent.promptCheckpoint.id);
    expect(applied.checkpoint.parentId).toBe(applied.safety?.id);
  });

  it("a follow-up sent from an applied node continues the ancestor conversation", async () => {
    const sent = await engine.sendPrompt("question", new FakeProvider("reply"));
    const applied = await engine.applyCodeBlock({
      nodeId: sent.promptCheckpoint.id,
      file: "src/follow.ts",
      content: "w\n",
      provider: "fake",
      model: "fake-model-1",
    });

    const followUp = new FakeProvider("second reply");
    const second = await engine.sendPrompt("follow up", followUp);

    expect(second.promptCheckpoint.parentId).toBe(applied.checkpoint.id);
    expect(followUp.lastMessages.map((message) => message.content)).toEqual(["question", "reply", "follow up"]);
    const carried = await engine.getConversation(second.promptCheckpoint.id);
    expect(carried.sourceId).toBe(second.promptCheckpoint.id);
    expect(carried.messages.map((message) => message.content)).toEqual([
      "question",
      "reply",
      "follow up",
      "second reply",
    ]);
  });

  it("applyCodeBlock refuses paths outside the workspace", async () => {
    const sent = await engine.sendPrompt("hack", new FakeProvider("ok"));
    await expect(
      engine.applyCodeBlock({
        nodeId: sent.promptCheckpoint.id,
        file: "../outside.ts",
        content: "nope",
        provider: "fake",
        model: "fake-model-1",
      }),
    ).rejects.toThrow(/outside the workspace/);
  });

  it("getConversation walks to the nearest ancestor with a sidecar", async () => {
    const sent = await engine.sendPrompt("parent question", new FakeProvider("parent reply"));
    const applied = await engine.applyCodeBlock({
      nodeId: sent.promptCheckpoint.id,
      file: "src/walk.ts",
      content: "z\n",
      provider: "fake",
      model: "fake-model-1",
    });

    const carried = await engine.getConversation(applied.checkpoint.id);
    expect(carried.sourceId).toBe(sent.promptCheckpoint.id);
    expect(carried.messages).toEqual((await engine.getConversation(sent.promptCheckpoint.id)).messages);
    const origin = (await engine.listCheckpoints()).find((checkpoint) => checkpoint.type === "origin");
    expect(await engine.getConversation(origin!.id)).toEqual({ sourceId: null, messages: [] });
  });

  it("deleting a checkpoint removes its conversation sidecar", async () => {
    const sent = await engine.sendPrompt("to be deleted", new FakeProvider("reply"));
    await engine.deleteCheckpoint(sent.promptCheckpoint.id);
    expect(
      await workspacePathExists(root, `.evograph/chat/${sent.promptCheckpoint.id}.json`),
    ).toBe(false);
  });
});
