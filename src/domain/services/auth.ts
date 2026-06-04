import { supabase } from "@/data/supabase";
import { mapSupabaseError, AppError } from "@/domain/errors";

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw mapSupabaseError(error);
    return data.session;
  },

  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw mapSupabaseError(error);
    return data.user;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw mapSupabaseError(error);
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw mapSupabaseError(error);
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw mapSupabaseError(error);
    return data.session;
  },

  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw mapSupabaseError(error);
    return data.user;
  },

  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw mapSupabaseError(error);
    return data.user;
  },
};
