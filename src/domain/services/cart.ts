import { supabase } from "@/data/supabase";
import { mapSupabaseError } from "@/domain/errors";
import type { CartType, CartItemType, CartStatus } from "@/domain/types";

const CART_COLS = "id, user_id, status, total_items, total_price, created_at, updated_at";
const ITEM_COLS = "id, cart_id, product_id, variant_id, quantity, price, selected_size, selected_color, variant_info, created_at, updated_at";
const ITEM_WITH_PRODUCT_COLS = `
  ${ITEM_COLS},
  product:products (
    product_id, slug, title, price, sale_price, image, stock, is_active, sku, category_id, created_at, updated_at
  ),
  variant:product_variants (id, stock, is_active)
`;

export interface CartVariantOptions {
  variantId?: number;
  size?: string;
  color?: string;
  variantInfo?: Record<string, unknown>;
}

export async function getActiveCart(userId: string): Promise<CartType | null> {
  const { data, error } = await supabase
    .from("carts")
    .select(CART_COLS)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw mapSupabaseError(error);
  return data as CartType | null;
}

export async function createCart(userId: string): Promise<CartType> {
  const { data, error } = await supabase
    .from("carts")
    .insert({ user_id: userId, status: "active" as CartStatus })
    .select(CART_COLS)
    .single();
  if (error) throw mapSupabaseError(error);
  return data as CartType;
}

export async function getOrCreateCart(userId: string): Promise<CartType> {
  const cart = await getActiveCart(userId);
  if (cart) return cart;
  return createCart(userId);
}

export async function getCartItems(cartId: number): Promise<CartItemType[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select(ITEM_WITH_PRODUCT_COLS)
    .eq("cart_id", cartId);
  if (error) throw mapSupabaseError(error);
  return (data ?? []).map((item) => {
    const variant = Array.isArray(item.variant) ? item.variant[0] : item.variant;
    const product = Array.isArray(item.product) ? item.product[0] : item.product;
    return {
      ...item,
      product: product
        ? { ...product, stock: variant?.stock ?? product.stock }
        : undefined,
    } as CartItemType;
  });
}

export async function addItemToCart(
  cartId: number,
  productId: string,
  price: number,
  quantity = 1,
  opts: CartVariantOptions = {},
): Promise<CartItemType> {
  const size = opts.size ?? null;
  const color = opts.color ?? null;

  // Check for existing identical line
  let q = supabase
    .from("cart_items")
    .select(ITEM_COLS)
    .eq("cart_id", cartId)
    .eq("product_id", productId);
  q = size ? q.eq("selected_size", size) : q.is("selected_size", null);
  q = color ? q.eq("selected_color", color) : q.is("selected_color", null);
  const { data: existing, error: fetchErr } = await q;
  if (fetchErr) throw mapSupabaseError(fetchErr);

  const first = existing?.[0];
  if (first) {
    const { data, error } = await supabase
      .from("cart_items")
      .update({ quantity: first.quantity + quantity, updated_at: new Date().toISOString() })
      .eq("id", first.id)
      .select(ITEM_COLS)
      .single();
    if (error) throw mapSupabaseError(error);
    return data as CartItemType;
  }

  const { data, error } = await supabase
    .from("cart_items")
    .insert({
      cart_id: cartId,
      product_id: productId,
      variant_id: opts.variantId ?? null,
      quantity,
      price,
      selected_size: size,
      selected_color: color,
      variant_info: opts.variantInfo ?? {},
    })
    .select(ITEM_COLS)
    .single();
  if (error) throw mapSupabaseError(error);
  return data as CartItemType;
}

export async function updateCartItemQuantity(
  cartItemId: number,
  quantity: number,
): Promise<CartItemType | true> {
  if (quantity <= 0) return removeCartItem(cartItemId);
  const { data, error } = await supabase
    .from("cart_items")
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq("id", cartItemId)
    .select(ITEM_COLS)
    .single();
  if (error) throw mapSupabaseError(error);
  return data as CartItemType;
}

export async function removeCartItem(cartItemId: number): Promise<true> {
  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);
  if (error) throw mapSupabaseError(error);
  return true;
}

export async function clearCart(cartId: number): Promise<true> {
  const { error } = await supabase.from("cart_items").delete().eq("cart_id", cartId);
  if (error) throw mapSupabaseError(error);
  return true;
}
