import { resolveImageUrl } from "@/lib/imageUrl";

// env.webUrl is "" in tests (no expo-constants extra), so relative paths stay relative.
describe("resolveImageUrl", () => {
  it("returns null for empty input", () => {
    expect(resolveImageUrl(null)).toBeNull();
    expect(resolveImageUrl(undefined)).toBeNull();
    expect(resolveImageUrl("")).toBeNull();
  });

  it("passes absolute http(s) URLs through unchanged", () => {
    const u = "https://x.supabase.co/storage/v1/object/public/product-images/a.jpg";
    expect(resolveImageUrl(u)).toBe(u);
  });

  it("leaves relative paths unchanged when no web URL is configured", () => {
    expect(resolveImageUrl("/products/a.jpg")).toBe("/products/a.jpg");
  });
});
