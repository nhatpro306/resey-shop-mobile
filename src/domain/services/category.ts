import { supabase } from "@/data/supabase";
import { mapSupabaseError } from "@/domain/errors";
import type { CategoryType } from "@/domain/types";

const CATEGORY_COLS = "id, name, description, parent_id";

export async function getCategories(): Promise<CategoryType[]> {
  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_COLS)
    .order("name");
  if (error) throw mapSupabaseError(error);
  return (data ?? []) as CategoryType[];
}

export async function getCategoryById(id: number): Promise<CategoryType | null> {
  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_COLS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw mapSupabaseError(error);
  return data as CategoryType | null;
}
