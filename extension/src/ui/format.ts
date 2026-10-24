import type { CheckpointType } from "../core/types";

const TYPE_LABELS: Record<CheckpointType, string> = {
  origin: "Origin",
  manual: "Manual change",
  ai_prompt: "AI prompt",
  ai_applied: "AI applied",
};

export function checkpointTypeLabel(type: CheckpointType): string {
  return TYPE_LABELS[type];
}

export function formatRelativeTime(isoTimestamp: string): string {
  const timestamp = Date.parse(isoTimestamp);
  if (Number.isNaN(timestamp)) return isoTimestamp;
  const minutes = Math.round((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
