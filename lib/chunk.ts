/**
 * Разбивает текст на чанки с перекрытием.
 * Размер чанка ~800–1200 символов, overlap ~150.
 */

const TARGET_CHUNK_SIZE = 1000;
const OVERLAP = 150;

export function chunkText(text: string): string[] {
  const normalized = text.trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + TARGET_CHUNK_SIZE, normalized.length);

    if (end < normalized.length) {
      // Пытаемся разбить по границе предложения или слова
      const slice = normalized.slice(start, end);
      const lastPeriod = slice.lastIndexOf(". ");
      const lastNewline = slice.lastIndexOf("\n");
      const lastSpace = slice.lastIndexOf(" ");
      const breakAt = Math.max(lastPeriod, lastNewline, lastSpace);
      if (breakAt > TARGET_CHUNK_SIZE / 2) {
        end = start + breakAt + 1;
      }
    }

    const chunk = normalized.slice(start, end).trim();
    if (chunk) chunks.push(chunk);

    start = end - (end < normalized.length ? OVERLAP : 0);
    if (start < 0) start = end;
  }

  return chunks;
}
