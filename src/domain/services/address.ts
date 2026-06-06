import { supabase } from "@/data/supabase";
import { mapSupabaseError } from "@/domain/errors";
import type { AddressType } from "@/domain/types";

const ADDRESS_COLS = "id, user_id, street, city, state, zip_code, country, is_default, created_at";

export async function getAddresses(userId: string): Promise<AddressType[]> {
  const { data, error } = await supabase
    .from("addresses")
    .select(ADDRESS_COLS)
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw mapSupabaseError(error);
  return (data ?? []) as AddressType[];
}

export async function saveAddress(
  userId: string,
  address: Omit<AddressType, "id" | "user_id" | "created_at">,
): Promise<AddressType> {
  const { data, error } = await supabase
    .from("addresses")
    .insert({ ...address, user_id: userId })
    .select(ADDRESS_COLS)
    .single();
  if (error) throw mapSupabaseError(error);
  return data as AddressType;
}

export async function updateAddress(
  addressId: number,
  fields: Partial<Omit<AddressType, "id" | "user_id">>,
): Promise<AddressType> {
  const { data, error } = await supabase
    .from("addresses")
    .update(fields)
    .eq("id", addressId)
    .select(ADDRESS_COLS)
    .single();
  if (error) throw mapSupabaseError(error);
  return data as AddressType;
}

export async function deleteAddress(addressId: number): Promise<true> {
  const { error } = await supabase.from("addresses").delete().eq("id", addressId);
  if (error) throw mapSupabaseError(error);
  return true;
}

export async function setDefaultAddress(userId: string, addressId: number): Promise<void> {
  // Unset all, then set the chosen one
  const { error: clearErr } = await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", userId);
  if (clearErr) throw mapSupabaseError(clearErr);

  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", addressId);
  if (error) throw mapSupabaseError(error);
}
