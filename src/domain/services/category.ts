import { supabase } from "@/data/supabase";
import { mapSupabaseError } from "@/domain/errors";
import type { CategoryType } from "@/domain/types";

export async function getCategories(): Promise<CategoryType[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (error) throw mapSupabaseError(error);
  return (data ?? []) as CategoryType[];
}

export async function getCategoryById(id: number): Promise<CategoryType | null> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw mapSupabaseError(error);
  return data as CategoryType | null;
}
