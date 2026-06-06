import { supabase } from "@/data/supabase";
import { mapSupabaseError } from "@/domain/errors";
import type { ProfileType } from "@/domain/types";

const PROFILE_COLS = "profile_id, username, avatar_url, email, role, is_active, created_at, updated_at";

export async function getProfile(userId: string): Promise<ProfileType | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLS)
    .eq("profile_id", userId)
    .maybeSingle();
  if (error) throw mapSupabaseError(error);
  return data as ProfileType | null;
}

export async function updateProfile(
  userId: string,
  fields: Partial<Pick<ProfileType, "username" | "avatar_url">>,
): Promise<ProfileType> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("profile_id", userId)
    .select(PROFILE_COLS)
    .single();
  if (error) throw mapSupabaseError(error);
  return data as ProfileType;
}

// Upload an avatar via base64 (from expo-image-picker).
// Returns the public URL. Path: avatars/<userId>/<filename>
export async function uploadAvatar(userId: string, uri: string, mime: string): Promise<string> {
  const ext = mime.split("/")[1] ?? "jpg";
  // Path is relative to the bucket; first folder = user id so RLS can scope writes.
  const path = `${userId}/avatar.${ext}`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(path, blob, { upsert: true, contentType: mime });
  if (upErr) throw mapSupabaseError(upErr);

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}
