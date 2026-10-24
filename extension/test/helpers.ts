import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

export async function createTempWorkspace(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "evograph-test-"));
}

export async function writeWorkspaceFile(root: string, relativePath: string, content: string): Promise<void> {
  const absolute = path.join(root, relativePath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, content, "utf8");
}

export async function readWorkspaceFile(root: string, relativePath: string): Promise<string> {
  return fs.readFile(path.join(root, relativePath), "utf8");
}

export async function workspacePathExists(root: string, relativePath: string): Promise<boolean> {
  try {
    await fs.access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

export async function removeTempWorkspace(root: string): Promise<void> {
  await fs.rm(root, { recursive: true, force: true });
}
