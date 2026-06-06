import { supabase } from "@/data/supabase";
import { mapSupabaseError } from "@/domain/errors";
import type { ProductType } from "@/domain/types";

export async function getWishlistIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("wishlists").select("product_id").eq("user_id", userId);
  if (error) throw mapSupabaseError(error);
  return (data ?? []).map((r) => r.product_id as string);
}

export async function getWishlistProducts(userId: string): Promise<ProductType[]> {
  const { data, error } = await supabase
    .from("wishlists")
    .select("product:products(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw mapSupabaseError(error);
  return (data ?? [])
    .map((r) => (r as unknown as { product: ProductType | null }).product)
    .filter((p): p is ProductType => !!p);
}

export async function addWishlist(userId: string, productId: string): Promise<void> {
  const { error } = await supabase.from("wishlists").upsert(
    { user_id: userId, product_id: productId },
    { onConflict: "user_id,product_id", ignoreDuplicates: true },
  );
  if (error) throw mapSupabaseError(error);
}

export async function removeWishlist(userId: string, productId: string): Promise<void> {
  const { error } = await supabase.from("wishlists").delete().eq("user_id", userId).eq("product_id", productId);
  if (error) throw mapSupabaseError(error);
}
