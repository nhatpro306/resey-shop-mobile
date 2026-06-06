import { supabase } from "@/data/supabase";
import { mapSupabaseError } from "@/domain/errors";
import type { StoreSettingsType } from "@/domain/types";

const SETTINGS_COLS =
  "id, store_name, slogan, logo_url, announcement_text, hero_badge_text, hero_title, hero_subtitle, hero_image_url, hero_primary_button_text, hero_primary_button_url, hero_secondary_button_text, hero_secondary_button_url, story_title, story_description, instagram_url, tiktok_url, contact_email, contact_phone, address, bank_name, bank_account_number, bank_account_name, shipping_fee, free_shipping_threshold, created_at, updated_at";

export async function getStoreSettings(): Promise<StoreSettingsType> {
  const { data, error } = await supabase
    .from("store_settings")
    .select(SETTINGS_COLS)
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
    .select(SETTINGS_COLS)
    .single();
  if (error) throw mapSupabaseError(error);
  return data as StoreSettingsType;
}
