import { supabase } from "@/data/supabase";
import { mapSupabaseError } from "@/domain/errors";
import type { StoreSettingsType } from "@/domain/types";

export async function getStoreSettings(): Promise<StoreSettingsType> {
  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .limit(1)
    .single();
  if (error) throw mapSupabaseError(error);
  return data as StoreSettingsType;
}

export async function updateStoreSettings(
  id: number,
  fields: Partial<StoreSettingsType>,
): Promise<StoreSettingsType> {
  const { data, error } = await supabase
    .from("store_settings")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw mapSupabaseError(error);
  return data as StoreSettingsType;
}
