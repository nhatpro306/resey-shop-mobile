import { supabase } from "@/data/supabase";
import { mapSupabaseError } from "@/domain/errors";

export async function uploadProductImage(
  productId: string,
  uri: string,
  mime: string,
  filename: string,
): Promise<string> {
  const path = `products/${productId}/${filename}`;
  const response = await fetch(uri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, blob, { upsert: true, contentType: mime });
  if (error) throw mapSupabaseError(error);

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteProductImage(path: string): Promise<true> {
  const { error } = await supabase.storage.from("product-images").remove([path]);
  if (error) throw mapSupabaseError(error);
  return true;
}

// Return a CDN-resized image URL from Supabase Storage (if transform is enabled on the plan).
export function getResizedImageUrl(url: string, width: number): string {
  if (!url.includes("supabase")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}width=${width}&format=webp`;
}
