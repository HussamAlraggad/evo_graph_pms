import type { CheckpointType } from "./types";

export interface SummarizeInput {
  type: CheckpointType;
  changedPaths: readonly string[];
}

export interface SummarizeResult {
  title: string;
  description: string;
}

/**
 * Pluggable title/description generation. M0 ships a deterministic heuristic;
 * an LLM-backed provider arrives with the assistant loop (M2).
 */
export interface CheckpointSummarizer {
  summarize(input: SummarizeInput): Promise<SummarizeResult>;
}

const MAX_LISTED_PATHS = 10;

export class HeuristicSummarizer implements CheckpointSummarizer {
  async summarize(input: SummarizeInput): Promise<SummarizeResult> {
    const paths = [...input.changedPaths].sort();
    if (paths.length === 0) {
      return {
        title: "Checkpoint (no changes)",
        description: "No file changes since the parent checkpoint.",
      };
    }
    const listed = paths.slice(0, MAX_LISTED_PATHS);
    const remaining = paths.length - listed.length;
    const description =
      remaining > 0
        ? `Changed files: ${listed.join(", ")} and ${remaining} more.`
        : `Changed files: ${listed.join(", ")}.`;
    const title = paths.length === 1 ? `Changed ${baseName(paths[0])}` : `Changed ${paths.length} files`;
    return { title, description };
  }
}

function baseName(relativePath: string): string {
  const segments = relativePath.split("/");
  return segments[segments.length - 1] ?? relativePath;
}
