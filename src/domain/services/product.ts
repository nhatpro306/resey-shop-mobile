import { supabase } from "@/data/supabase";
import { mapSupabaseError } from "@/domain/errors";
import { toPage, type Cursor, type Page } from "@/domain/pagination";
import type { ProductType, ProductFilters } from "@/domain/types";

// Column-scoped selects only — never select('*') on list endpoints (perf, payload size).
const LIST_COLUMNS = "product_id,slug,title,price,sale_price,image,stock,is_active,created_at,updated_at";
const DETAIL_COLUMNS = "*, images:product_images(*), variants:product_variants(*), category:categories(*)";

const PAGE_SIZE = 20;

export async function listProducts(
  filters: ProductFilters = {},
  cursor: Cursor | null = null,
): Promise<Page<ProductType & { id: string }>> {
  let query = supabase
    .from("products")
    .select(LIST_COLUMNS)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .order("product_id", { ascending: false })
    .limit(PAGE_SIZE + 1); // fetch one extra to compute nextCursor

  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.inStock) query = query.gt("stock", 0);
  if (filters.search) query = query.ilike("title", `%${filters.search}%`);
  if (cursor) query = query.lt("created_at", cursor.createdAt);

  const { data, error } = await query;
  if (error) throw mapSupabaseError(error);

  // Map product_id -> id for the keyset helper; UI uses domain fields.
  const rows = (data ?? []).map((r) => ({ ...(r as ProductType), id: (r as ProductType).product_id }));
  return toPage(rows, PAGE_SIZE);
}

export async function getProductBySlug(slug: string): Promise<ProductType> {
  const { data, error } = await supabase
    .from("products")
    .select(DETAIL_COLUMNS)
    .eq("slug", slug)
    .single();
  if (error) throw mapSupabaseError(error);
  return data as ProductType;
}
