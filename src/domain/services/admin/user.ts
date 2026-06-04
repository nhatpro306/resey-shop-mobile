import { supabase } from "@/data/supabase";
import { mapSupabaseError } from "@/domain/errors";
import type { ProfileType, UserRole } from "@/domain/types";

export async function adminListUsers(
  page = 1,
  limit = 30,
): Promise<{ users: ProfileType[]; total: number }> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const [{ data, error }, { count, error: countErr }] = await Promise.all([
    supabase
      .from("profiles")
      .select("profile_id, username, email, role, is_active, avatar_url, created_at, updated_at")
      .order("created_at", { ascending: false })
      .range(from, to),
    supabase.from("profiles").select("profile_id", { count: "exact", head: true }),
  ]);
  if (error) throw mapSupabaseError(error);
  if (countErr) throw mapSupabaseError(countErr);

  return { users: (data ?? []) as ProfileType[], total: count ?? 0 };
}

export async function adminToggleUserActive(userId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("profile_id", userId);
  if (error) throw mapSupabaseError(error);
}

export async function adminSetUserRole(userId: string, role: UserRole): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("profile_id", userId);
  if (error) throw mapSupabaseError(error);
}
