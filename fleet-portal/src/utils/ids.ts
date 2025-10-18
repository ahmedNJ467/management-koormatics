export function toShortId(
  sourceId: string | undefined | null,
  length = 8
): string {
  if (!sourceId) return "-";
  const cleaned = String(sourceId).replace(/[^a-zA-Z0-9]/g, "");
  if (!cleaned) return "-";
  return cleaned.slice(0, Math.max(1, length)).toUpperCase();
}
