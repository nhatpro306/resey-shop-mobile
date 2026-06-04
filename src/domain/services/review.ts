import { supabase } from "@/data/supabase";
import { mapSupabaseError, AppError } from "@/domain/errors";
import type { ReviewType } from "@/domain/types";

export async function getReviewsByProduct(productId: string): Promise<ReviewType[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, profile:profiles(profile_id, username, avatar_url)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error) throw mapSupabaseError(error);
  return (data ?? []) as unknown as ReviewType[];
}

export async function createReview(
  productId: string,
  userId: string,
  rating: number,
  comment: string,
): Promise<ReviewType> {
  const { data, error } = await supabase
    .from("reviews")
    .insert({ product_id: productId, user_id: userId, rating, comment })
    .select("*")
    .single();
  if (error) throw mapSupabaseError(error);
  return data as ReviewType;
}

export async function updateReview(
  id: number,
  userId: string,
  rating: number,
  comment: string,
): Promise<ReviewType> {
  const { data, error } = await supabase
    .from("reviews")
    .update({ rating, comment, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw mapSupabaseError(error);
  return data as ReviewType;
}

export async function deleteReview(id: number, userId: string): Promise<true> {
  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw mapSupabaseError(error);
  return true;
}
