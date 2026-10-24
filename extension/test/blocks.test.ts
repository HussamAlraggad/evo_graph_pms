import { describe, expect, it } from "vitest";
import { isUsableFilePath, parseContent } from "../src/ai/blocks";

describe("parseContent", () => {
  it("returns a single prose block for plain text", () => {
    expect(parseContent("Just a reply.\nSecond line.")).toEqual([
      { kind: "prose", text: "Just a reply.\nSecond line." },
    ]);
  });

  it("returns no blocks for empty or whitespace-only content", () => {
    expect(parseContent("")).toEqual([]);
    expect(parseContent("\n  \n")).toEqual([]);
  });

  it("parses a tagged code block between prose", () => {
    const content = [
      "Here is the change.",
      "",
      "```ts file:src/example.ts",
      "export const x = 1;",
      "```",
      "",
      "That should fix it.",
    ].join("\n");
    expect(parseContent(content)).toEqual([
      { kind: "prose", text: "Here is the change." },
      { kind: "code", language: "ts", file: "src/example.ts", code: "export const x = 1;" },
      { kind: "prose", text: "That should fix it." },
    ]);
  });

  it("accepts a file tag without a language", () => {
    const blocks = parseContent(["```file:src/plain.ts", "a", "```"].join("\n"));
    expect(blocks).toEqual([{ kind: "code", language: null, file: "src/plain.ts", code: "a" }]);
  });

  it("keeps untagged code blocks as plain code", () => {
    const blocks = parseContent(["```bash", "npm run check", "```"].join("\n"));
    expect(blocks).toEqual([{ kind: "code", language: "bash", file: null, code: "npm run check" }]);
  });

  it("handles multiple blocks and blank prose between them", () => {
    const content = ["```ts file:a.ts", "a", "```", "", "```ts file:b.ts", "b", "```"].join("\n");
    expect(parseContent(content)).toEqual([
      { kind: "code", language: "ts", file: "a.ts", code: "a" },
      { kind: "code", language: "ts", file: "b.ts", code: "b" },
    ]);
  });

  it("treats an unterminated fence as code to the end", () => {
    const content = ["Intro.", "```ts file:src/tail.ts", "const a = 1;", "const b = 2;"].join("\n");
    expect(parseContent(content)).toEqual([
      { kind: "prose", text: "Intro." },
      { kind: "code", language: "ts", file: "src/tail.ts", code: "const a = 1;\nconst b = 2;" },
    ]);
  });

  it("drops unusable file tags but keeps the code", () => {
    const content = ["```ts file:../escape.ts", "x", "```"].join("\n");
    expect(parseContent(content)).toEqual([{ kind: "code", language: "ts", file: null, code: "x" }]);
  });
});

describe("isUsableFilePath", () => {
  it("accepts plain workspace-relative paths", () => {
    expect(isUsableFilePath("src/foo.ts")).toBe(true);
    expect(isUsableFilePath("foo.ts")).toBe(true);
    expect(isUsableFilePath("a/b/c/file.name.ext")).toBe(true);
  });

  it("rejects absolute, escaping, and scheme-like paths", () => {
    expect(isUsableFilePath("/etc/passwd")).toBe(false);
    expect(isUsableFilePath("../outside.ts")).toBe(false);
    expect(isUsableFilePath("src/../outside.ts")).toBe(false);
    expect(isUsableFilePath("src//double.ts")).toBe(false);
    expect(isUsableFilePath("src/./dot.ts")).toBe(false);
    expect(isUsableFilePath("C:/windows/system32")).toBe(false);
    expect(isUsableFilePath("https://example.com/x.ts")).toBe(false);
    expect(isUsableFilePath("src\\windows.ts")).toBe(false);
    expect(isUsableFilePath("")).toBe(false);
  });
});
