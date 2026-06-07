import { supabase } from "@/data/supabase";
import { mapSupabaseError } from "@/domain/errors";
import type { ProductType, ProductVariantType, ProductImageType } from "@/domain/types";

const ADMIN_COLS = `
  product_id, slug, title, description, material, price, sale_price, image,
  stock, sizes, colors, is_active, sku, category_id, created_at, updated_at,
  category:categories (id, name),
  images:product_images (id, product_id, url, alt_text, sort_order, is_primary, created_at),
  variants:product_variants (id, product_id, size, color, sku, stock, price_override, image_url, is_active, created_at, updated_at)
`;

export interface CreateProductData {
  title: string;
  slug?: string;
  description: string;
  material?: string;
  price: number;
  sale_price?: number | null;
  image?: string;
  stock: number;
  sizes?: string[];
  colors?: string[];
  is_active?: boolean;
  sku?: string;
  category_id?: number;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  updated_at?: string;
}

export async function adminListProducts(
  page = 1,
  limit = 30,
): Promise<{ products: ProductType[]; total: number }> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const [{ data, error }, { count, error: countErr }] = await Promise.all([
    supabase.from("products").select(ADMIN_COLS).order("created_at", { ascending: false }).range(from, to),
    supabase.from("products").select("product_id", { count: "exact", head: true }),
  ]);

  if (error) throw mapSupabaseError(error);
  if (countErr) throw mapSupabaseError(countErr);

  return { products: (data ?? []) as unknown as ProductType[], total: count ?? 0 };
}

export async function adminGetProduct(productId: string): Promise<ProductType> {
  const { data, error } = await supabase
    .from("products")
    .select(ADMIN_COLS)
    .eq("product_id", productId)
    .single();
  if (error) throw mapSupabaseError(error);
  return data as unknown as ProductType;
}

export async function adminCreateProduct(input: CreateProductData): Promise<ProductType> {
  const { data, error } = await supabase
    .from("products")
    .insert({ ...input, is_active: input.is_active ?? true })
    .select(ADMIN_COLS)
    .single();
  if (error) throw mapSupabaseError(error);
  return data as unknown as ProductType;
}

export async function adminUpdateProduct(
  productId: string,
  input: UpdateProductData,
): Promise<ProductType> {
  const { data, error } = await supabase
    .from("products")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("product_id", productId)
    .select(ADMIN_COLS)
    .single();
  if (error) throw mapSupabaseError(error);
  return data as unknown as ProductType;
}

export async function adminToggleProduct(productId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("product_id", productId);
  if (error) throw mapSupabaseError(error);
}

const VARIANT_COLS = "id, product_id, size, color, sku, stock, price_override, image_url, is_active, created_at, updated_at";
const IMAGE_COLS = "id, product_id, url, alt_text, sort_order, is_primary, created_at";

export async function adminUpsertVariant(
  variant: Partial<ProductVariantType> & { product_id: string },
): Promise<ProductVariantType> {
  const { data, error } = await supabase
    .from("product_variants")
    .upsert({ ...variant, updated_at: new Date().toISOString() })
    .select(VARIANT_COLS)
    .single();
  if (error) throw mapSupabaseError(error);
  return data as ProductVariantType;
}

export async function adminDeleteVariant(variantId: number): Promise<true> {
  const { error } = await supabase.from("product_variants").delete().eq("id", variantId);
  if (error) throw mapSupabaseError(error);
  return true;
}

export async function adminAddProductImage(
  productId: string,
  url: string,
  isPrimary: boolean,
  sortOrder: number,
): Promise<ProductImageType> {
  const { data, error } = await supabase
    .from("product_images")
    .insert({ product_id: productId, url, is_primary: isPrimary, sort_order: sortOrder })
    .select(IMAGE_COLS)
    .single();
  if (error) throw mapSupabaseError(error);
  return data as ProductImageType;
}

export async function adminDeleteProductImage(imageId: number): Promise<true> {
  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) throw mapSupabaseError(error);
  return true;
}

export async function adminGetProductAnalytics() {
  const [{ count: total }, { data: categoryRows }, { data: stockRows }] = await Promise.all([
    supabase.from("products").select("product_id", { count: "exact", head: true }),
    supabase.from("products").select("category_id, category:categories(name)"),
    supabase.from("products").select("stock").lt("stock", 10).gt("stock", 0),
  ]);

  const categoryStats: Record<string, number> = {};
  for (const row of categoryRows ?? []) {
    const cat = Array.isArray(row.category) ? row.category[0] : row.category;
    const name = (cat as { name?: string } | null)?.name ?? "Uncategorized";
    categoryStats[name] = (categoryStats[name] ?? 0) + 1;
  }

  return {
    totalProducts: total ?? 0,
    lowStockCount: stockRows?.length ?? 0,
    categoryStats,
  };
}
