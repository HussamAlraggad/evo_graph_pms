import { execFile } from "node:child_process";

export interface RunGitOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

export class GitError extends Error {
  readonly args: readonly string[];
  readonly stderr: string;
  readonly exitCode: number | null;

  constructor(message: string, args: readonly string[], stderr: string, exitCode: number | null) {
    super(message);
    this.name = "GitError";
    this.args = args;
    this.stderr = stderr;
    this.exitCode = exitCode;
  }
}

/**
 * Runs a non-interactive git command and returns its stdout.
 * Always sets GIT_TERMINAL_PROMPT=0 so git can never block on a credential prompt.
 */
export async function runGit(args: string[], options: RunGitOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "git",
      args,
      {
        cwd: options.cwd,
        env: { ...process.env, GIT_TERMINAL_PROMPT: "0", ...options.env },
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (error) {
          const errno = (error as NodeJS.ErrnoException).code;
          if (errno === "ENOENT") {
            reject(new GitError("git executable not found. Install Git and make sure it is on PATH.", args, stderr, null));
            return;
          }
          const exitCode = typeof errno === "number" ? errno : null;
          const detail = stderr.trim().length > 0 ? stderr.trim() : error.message;
          reject(new GitError(`git ${args[0] ?? ""} failed: ${detail}`, args, stderr, exitCode));
          return;
        }
        resolve(stdout);
      },
    );
  });
}
