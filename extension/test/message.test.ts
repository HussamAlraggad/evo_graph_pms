import { describe, expect, it } from "vitest";
import {
  CheckpointDecodeError,
  decodeCheckpointMessage,
  encodeCheckpointMessage,
  META_MARKER,
} from "../src/core/message";
import type { CheckpointMeta } from "../src/core/types";

function sampleMeta(overrides: Partial<CheckpointMeta> = {}): CheckpointMeta {
  return {
    schemaVersion: 1,
    id: "0f6c2f78-3f0a-4a58-9c2a-3f3d6f9a1b2c",
    type: "manual",
    title: "Changed app.ts",
    description: "Changed files: app.ts.",
    createdAt: "2026-10-24T12:00:00.000Z",
    parentId: null,
    ...overrides,
  };
}

describe("checkpoint message codec", () => {
  it("round-trips metadata", () => {
    const meta = sampleMeta();
    const decoded = decodeCheckpointMessage(encodeCheckpointMessage(meta));
    expect(decoded).toEqual(meta);
  });

  it("round-trips parentId and taskId", () => {
    const meta = sampleMeta({
      parentId: "8a1b0c2d-1111-4222-8333-444455556666",
      taskId: "102",
    });
    const decoded = decodeCheckpointMessage(encodeCheckpointMessage(meta));
    expect(decoded.parentId).toBe("8a1b0c2d-1111-4222-8333-444455556666");
    expect(decoded.taskId).toBe("102");
  });

  it("rejects messages without the metadata marker, naming the commit", () => {
    expect(() => decodeCheckpointMessage("just a commit message", "abc123")).toThrow(/abc123/);
    expect(() => decodeCheckpointMessage("just a commit message", "abc123")).toThrow(CheckpointDecodeError);
  });

  it("rejects invalid JSON after the marker", () => {
    const message = `title\n\n${META_MARKER}\n{not json`;
    expect(() => decodeCheckpointMessage(message)).toThrow(/not valid JSON/);
  });

  it("rejects unsupported schema versions", () => {
    const message = `title\n\n${META_MARKER}\n${JSON.stringify({ ...sampleMeta(), schemaVersion: 99 })}`;
    expect(() => decodeCheckpointMessage(message)).toThrow(/unsupported schemaVersion 99/);
  });

  it("rejects unknown checkpoint types", () => {
    const message = `title\n\n${META_MARKER}\n${JSON.stringify({ ...sampleMeta(), type: "mystery" })}`;
    expect(() => decodeCheckpointMessage(message)).toThrow(/unknown checkpoint type/);
  });

  it("strips control characters from titles and descriptions", () => {
    const meta = sampleMeta({ title: "bad\u001e title", description: "line\u0000one" });
    const decoded = decodeCheckpointMessage(encodeCheckpointMessage(meta));
    expect(decoded.title).toBe("bad title");
    expect(decoded.description).toBe("lineone");
  });
});
