import { supabase } from "@/data/supabase";
import { mapSupabaseError, AppError } from "@/domain/errors";
import type { OrderType, OrderStatus } from "@/domain/types";

const VALID_STATUSES: OrderStatus[] = [
  "pending", "processing", "confirmed", "shipping", "shipped",
  "completed", "delivered", "cancelled",
];

const ADMIN_ORDER_COLS = `
  id, user_id, status, total, shipping_address_id, payment_method, payment_id,
  customer_name, customer_phone, customer_email, customer_note, created_at, updated_at,
  profile:profiles!orders_user_id_fkey (profile_id, username, email),
  shipping_address:addresses!orders_shipping_address_id_fkey (id, street, city, state, zip_code, country),
  order_items (
    id, order_id, product_id, quantity, price, selected_size, selected_color,
    product_title_snapshot, product_image_snapshot, sku_snapshot
  )
`;

export interface AdminOrderFilters {
  status?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function adminListOrders(
  filters: AdminOrderFilters = {},
  page = 1,
  limit = 30,
): Promise<{ orders: OrderType[]; total: number }> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let q = supabase.from("orders").select(ADMIN_ORDER_COLS).order("created_at", { ascending: false });
  let cq = supabase.from("orders").select("id", { count: "exact", head: true });

  if (filters.status) { q = q.eq("status", filters.status); cq = cq.eq("status", filters.status); }
  if (filters.userId) { q = q.eq("user_id", filters.userId); cq = cq.eq("user_id", filters.userId); }
  if (filters.dateFrom) { q = q.gte("created_at", filters.dateFrom); cq = cq.gte("created_at", filters.dateFrom); }
  if (filters.dateTo) { q = q.lte("created_at", filters.dateTo); cq = cq.lte("created_at", filters.dateTo); }

  const [{ data, error }, { count, error: countErr }] = await Promise.all([
    q.range(from, to),
    cq,
  ]);
  if (error) throw mapSupabaseError(error);
  if (countErr) throw mapSupabaseError(countErr);

  return { orders: (data ?? []) as unknown as OrderType[], total: count ?? 0 };
}

export async function adminGetOrder(orderId: number): Promise<OrderType> {
  const { data, error } = await supabase
    .from("orders")
    .select(ADMIN_ORDER_COLS)
    .eq("id", orderId)
    .single();
  if (error) throw mapSupabaseError(error);
  return data as unknown as OrderType;
}

export async function adminUpdateOrderStatus(
  orderId: number,
  status: OrderStatus,
): Promise<OrderType> {
  if (!VALID_STATUSES.includes(status)) {
    throw new AppError("VALIDATION", `Invalid order status: ${status}`);
  }
  const ORDER_COLS = "id, user_id, status, total, shipping_address_id, payment_method, payment_id, customer_name, customer_phone, customer_email, customer_note, created_at, updated_at";
  const { data, error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select(ORDER_COLS)
    .single();
  if (error) throw mapSupabaseError(error);
  return data as OrderType;
}

export async function adminGetDashboard() {
  const todayIso = new Date();
  todayIso.setHours(0, 0, 0, 0);

  const [totalRes, todayRes, pendingRes, processingRes, recentRes] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("total").gte("created_at", todayIso.toISOString()),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "processing"),
    supabase
      .from("orders")
      .select("id, user_id, status, total, customer_name, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const todayOrders = todayRes.data ?? [];
  return {
    totalOrders: totalRes.count ?? 0,
    todayOrders: todayOrders.length,
    todayRevenue: todayOrders.reduce((s, o) => s + Number(o.total || 0), 0),
    ordersByStatus: {
      pending: pendingRes.count ?? 0,
      processing: processingRes.count ?? 0,
    },
    recentOrders: (recentRes.data ?? []) as unknown as OrderType[],
  };
}
