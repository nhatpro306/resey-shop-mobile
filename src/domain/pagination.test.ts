import { toPage } from "./pagination";
import { mapSupabaseError, AppError } from "./errors";

describe("toPage (keyset pagination)", () => {
  const rows = Array.from({ length: 21 }, (_, i) => ({
    id: String(i),
    created_at: `2026-01-${String(i + 1).padStart(2, "0")}`,
  }));

  it("returns limit items and a nextCursor when there is more", () => {
    const page = toPage(rows, 20);
    expect(page.items).toHaveLength(20);
    expect(page.nextCursor).toEqual({ createdAt: rows[19]!.created_at, id: "19" });
  });

  it("returns null cursor on the last page", () => {
    const page = toPage(rows.slice(0, 10), 20);
    expect(page.items).toHaveLength(10);
    expect(page.nextCursor).toBeNull();
  });
});

describe("mapSupabaseError", () => {
  it("maps 403 to FORBIDDEN", () => {
    const e = mapSupabaseError({ status: 403 });
    expect(e).toBeInstanceOf(AppError);
    expect(e.code).toBe("FORBIDDEN");
  });

  it("maps stock check violation to OUT_OF_STOCK", () => {
    expect(mapSupabaseError({ code: "P0001" }).code).toBe("OUT_OF_STOCK");
  });

  it("falls back to UNKNOWN", () => {
    expect(mapSupabaseError({ message: "weird" }).code).toBe("UNKNOWN");
  });
});
