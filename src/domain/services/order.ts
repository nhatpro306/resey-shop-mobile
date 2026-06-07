import { supabase } from "@/data/supabase";
import { mapSupabaseError, AppError } from "@/domain/errors";
import type { OrderType, CheckoutPayload } from "@/domain/types";

const ORDER_COLS =
  "id, user_id, status, total, shipping_address_id, customer_name, customer_phone, customer_email, customer_note, payment_method, payment_id, created_at, updated_at";

const ORDER_DETAIL_COLS = `
  ${ORDER_COLS},
  order_items (
    id, order_id, product_id, variant_id, quantity, price,
    selected_size, selected_color, variant_info,
    product_title_snapshot, product_image_snapshot, sku_snapshot, size_snapshot, color_snapshot,
    product:products (product_id, title, image)
  ),
  shipping_address:addresses!shipping_address_id (id, user_id, street, city, state, zip_code, country, is_default, created_at)
`;

export async function createOrder(payload: CheckoutPayload): Promise<OrderType> {
  const sanitizedItems = payload.items
    .filter((i) => i.product_id && i.quantity > 0)
    .map((i) => ({
      product_id: i.product_id,
      variant_id: i.variant_id ?? null,
      quantity: i.quantity,
      selected_size: i.selected_size ?? null,
      selected_color: i.selected_color ?? null,
    }));

  if (sanitizedItems.length === 0) {
    throw new AppError("VALIDATION", "Cart is empty.");
  }

  const shippingFee =
    typeof payload.shippingFee === "number" && isFinite(payload.shippingFee) && payload.shippingFee >= 0
      ? payload.shippingFee
      : 0;

  const { data: orderId, error: rpcError } = await supabase.rpc("create_order_checkout", {
    payload: {
      cart_id: payload.cartId ?? null,
      shipping_address_id: payload.shippingAddressId,
      payment_method: payload.paymentMethod,
      payment_id: payload.paymentId ?? null,
      shipping_fee: shippingFee,
      customer_name: payload.customerName ?? null,
      customer_phone: payload.customerPhone ?? null,
      customer_email: payload.customerEmail ?? null,
      customer_note: payload.customerNote ?? null,
      items: sanitizedItems,
    },
  });

  if (rpcError) {
    const raw = rpcError.message ?? "";
    if (raw.includes("Not enough stock") || raw.includes("no longer available")) {
      throw new AppError("OUT_OF_STOCK", "Some items ran out of stock. Please review your cart.", rpcError);
    }
    if (raw.includes("Authentication required")) {
      throw new AppError("AUTH_REQUIRED", "Session expired. Please sign in again.", rpcError);
    }
    throw mapSupabaseError(rpcError);
  }

  const { data: order, error: fetchErr } = await supabase
    .from("orders")
    .select(ORDER_DETAIL_COLS)
    .eq("id", orderId as number)
    .single();
  if (fetchErr || !order) {
    throw new AppError("NOT_FOUND", "Order placed but could not reload it. Check your orders page.");
  }
  return order as unknown as OrderType;
}

export async function getOrders(userId: string): Promise<OrderType[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_DETAIL_COLS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw mapSupabaseError(error);
  return (data ?? []) as unknown as OrderType[];
}

export async function getOrderById(orderId: number): Promise<OrderType> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_DETAIL_COLS)
    .eq("id", orderId)
    .single();
  if (error) throw mapSupabaseError(error);
  return data as unknown as OrderType;
}
