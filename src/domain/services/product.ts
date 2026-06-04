import { supabase } from "@/data/supabase";
import { mapSupabaseError } from "@/domain/errors";
import { toPage, type Cursor, type Page } from "@/domain/pagination";
import type { ProductType, ProductFilters } from "@/domain/types";

const PAGE_SIZE = 20;

const LIST_COLS = [
  "product_id", "slug", "title", "price", "sale_price",
  "image", "stock", "is_active", "category_id", "created_at", "updated_at",
].join(",");

const DETAIL_COLS = "*, images:product_images(*), variants:product_variants(*), category:categories(*)";

export async function listProducts(
  filters: ProductFilters = {},
  cursor: Cursor | null = null,
): Promise<Page<ProductType>> {
  let query = supabase
    .from("products")
    .select(LIST_COLS)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .order("product_id", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.inStock) query = query.gt("stock", 0);
  if (filters.search) query = query.ilike("title", `%${filters.search}%`);
  if (filters.sort === "price_asc") query = query.order("price", { ascending: true });
  else if (filters.sort === "price_desc") query = query.order("price", { ascending: false });
  if (cursor) {
    query = query
      .lt("created_at", cursor.createdAt)
      .neq("product_id", cursor.id);
  }

  const { data, error } = await query;
  if (error) throw mapSupabaseError(error);

  const rows = (data ?? []) as unknown as ProductType[];
  return toPage(
    rows.map((r) => ({ ...r, id: r.product_id, created_at: r.created_at })),
    PAGE_SIZE,
  ) as unknown as Page<ProductType>;
}

export async function getProductBySlug(slug: string): Promise<ProductType> {
  const { data, error } = await supabase
    .from("products")
    .select(DETAIL_COLS)
    .eq("slug", slug)
    .single();
  if (error) throw mapSupabaseError(error);
  return data as unknown as ProductType;
}

export async function getProductById(productId: string): Promise<ProductType> {
  const { data, error } = await supabase
    .from("products")
    .select(DETAIL_COLS)
    .eq("product_id", productId)
    .single();
  if (error) throw mapSupabaseError(error);
  return data as unknown as ProductType;
}

export async function searchProducts(query: string): Promise<ProductType[]> {
  const { data, error } = await supabase
    .from("products")
    .select(LIST_COLS)
    .eq("is_active", true)
    .ilike("title", `%${query}%`)
    .order("title")
    .limit(30);
  if (error) throw mapSupabaseError(error);
  return (data ?? []) as unknown as ProductType[];
}
