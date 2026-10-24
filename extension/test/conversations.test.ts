import * as fs from "node:fs/promises";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ConversationStore } from "../src/core/conversations";
import { createTempWorkspace, removeTempWorkspace } from "./helpers";

const ID_A = "0f6c2f78-3f0a-4a58-9c2a-3f3d6f9a1b2c";
const ID_B = "8a1b0c2d-1111-4222-8333-444455556666";

describe("ConversationStore", () => {
  let root: string;
  let store: ConversationStore;

  beforeEach(async () => {
    root = await createTempWorkspace();
    store = new ConversationStore(root);
  });

  afterEach(async () => {
    await removeTempWorkspace(root);
  });

  it("returns an empty conversation when no sidecar exists", async () => {
    expect(await store.read(ID_A)).toEqual([]);
  });

  it("round-trips messages through the sidecar", async () => {
    const messages = [
      { role: "user" as const, content: "Fix the race condition", createdAt: "2026-10-24T12:00:00.000Z" },
      { role: "assistant" as const, content: "Here is a patch.", createdAt: "2026-10-24T12:00:05.000Z" },
    ];
    await store.write(ID_A, messages);
    expect(await store.read(ID_A)).toEqual(messages);
  });

  it("removes sidecars", async () => {
    await store.write(ID_A, []);
    await store.remove(ID_A);
    expect(await store.read(ID_A)).toEqual([]);
  });

  it("rejects corrupt sidecars explicitly", async () => {
    await fs.mkdir(store.chatDir, { recursive: true });
    await fs.writeFile(path.join(store.chatDir, `${ID_A}.json`), "{not json", "utf8");
    await expect(store.read(ID_A)).rejects.toThrow(/Unexpected token|JSON/);
  });

  it("rejects unsupported sidecar versions", async () => {
    await store.write(ID_A, []);
    const file = path.join(store.chatDir, `${ID_A}.json`);
    const parsed = JSON.parse(await fs.readFile(file, "utf8")) as { schemaVersion: number };
    parsed.schemaVersion = 99;
    await fs.writeFile(file, JSON.stringify(parsed), "utf8");
    await expect(store.read(ID_A)).rejects.toThrow(/Unsupported conversation sidecar version/);
  });

  it("rejects invalid checkpoint ids for sidecar paths", async () => {
    await expect(store.write("bad id!", [])).rejects.toThrow(/Invalid checkpoint id/);
    await expect(store.read("../../etc/passwd")).rejects.toThrow(/Invalid checkpoint id/);
  });

  it("keeps sidecars per checkpoint id", async () => {
    await store.write(ID_A, [{ role: "user", content: "A", createdAt: "2026-10-24T12:00:00.000Z" }]);
    await store.write(ID_B, [{ role: "user", content: "B", createdAt: "2026-10-24T12:00:01.000Z" }]);
    expect((await store.read(ID_A))[0].content).toBe("A");
    expect((await store.read(ID_B))[0].content).toBe("B");
  });
});
