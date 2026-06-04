// Keyset (cursor) pagination helpers — pure, testable, no I/O.
// We page by created_at + id to get a stable total order even with duplicate timestamps.
export interface Cursor {
  createdAt: string;
  id: string;
}

export interface Page<T> {
  items: T[];
  nextCursor: Cursor | null;
}

export function toPage<T extends { id: string; created_at: string }>(
  rows: T[],
  limit: number,
): Page<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  const nextCursor = hasMore && last ? { createdAt: last.created_at, id: last.id } : null;
  return { items, nextCursor };
}
