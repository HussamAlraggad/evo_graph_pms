export interface ProseBlock {
  kind: "prose";
  text: string;
}

export interface CodeBlock {
  kind: "code";
  language: string | null;
  /** Workspace-relative target from the `file:` info-string tag; null when absent or unusable. */
  file: string | null;
  code: string;
}

export type ContentBlock = ProseBlock | CodeBlock;

const OPENING_FENCE = /^```(.*)$/;
const CLOSING_FENCE = /^```\s*$/;

/**
 * Splits assistant content into prose and fenced code blocks. A fence's info string
 * may carry a language and a `file:<path>` tag (`ts file:src/foo.ts`): the tag is the
 * convention that makes Apply possible. An unterminated fence runs to the end.
 */
export function parseContent(content: string): ContentBlock[] {
  const lines = content.split(/\r?\n/);
  const blocks: ContentBlock[] = [];
  let prose: string[] = [];

  const flushProse = (): void => {
    const text = prose.join("\n").trim();
    if (text.length > 0) blocks.push({ kind: "prose", text });
    prose = [];
  };

  let index = 0;
  while (index < lines.length) {
    const opening = OPENING_FENCE.exec(lines[index]);
    const isClosingOnly = CLOSING_FENCE.test(lines[index]);
    if (!opening || isClosingOnly) {
      prose.push(lines[index]);
      index += 1;
      continue;
    }
    flushProse();
    const info = parseInfoString(opening[1]);
    index += 1;
    const codeLines: string[] = [];
    while (index < lines.length && !CLOSING_FENCE.test(lines[index])) {
      codeLines.push(lines[index]);
      index += 1;
    }
    if (index < lines.length) index += 1;
    blocks.push({ kind: "code", language: info.language, file: info.file, code: codeLines.join("\n") });
  }
  flushProse();
  return blocks;
}

function parseInfoString(info: string): { language: string | null; file: string | null } {
  let language: string | null = null;
  let file: string | null = null;
  for (const token of info.trim().split(/\s+/)) {
    if (token.length === 0) continue;
    if (token.startsWith("file:")) {
      const candidate = token.slice("file:".length);
      if (isUsableFilePath(candidate)) file = candidate;
    } else if (language === null) {
      language = token;
    }
  }
  return { language, file };
}

/**
 * A file tag is only usable when it names a plain workspace-relative path — no
 * absolute paths, no `..` segments, no drive letters or URL schemes.
 */
export function isUsableFilePath(value: string): boolean {
  if (value.length === 0) return false;
  if (value.includes("\\")) return false;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) return false;
  const segments = value.split("/");
  return segments.every((segment) => segment.length > 0 && segment !== "." && segment !== "..");
}
