// Domain models — framework-free, portable (shared shape with the web app's types.ts).
// Port the full set from the web repo in M1; this is the M0 core subset.

export type CartStatus = "active" | "abandoned" | "converted";

export type OrderStatus =
  | "pending"
  | "processing"
  | "confirmed"
  | "shipping"
  | "shipped"
  | "completed"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cod" | "bank_transfer";
export type UserRole = "customer" | "admin";

export interface CategoryType {
  id: string;
  name: string;
  description?: string | null;
  parent_id?: string | null;
}

export interface ProductImageType {
  id: string;
  product_id: string;
  url: string;
  alt_text?: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductVariantType {
  id: string;
  product_id: string;
  size?: string | null;
  color?: string | null;
  sku?: string | null;
  stock: number;
  price_override?: number | null;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductType {
  product_id: string;
  slug: string;
  title: string;
  description?: string | null;
  material?: string | null;
  price: number;
  sale_price?: number | null;
  image?: string | null;
  stock: number;
  sizes?: string[] | null;
  colors?: string[] | null;
  is_active: boolean;
  sku?: string | null;
  category_id?: string | null;
  variants?: ProductVariantType[];
  images?: ProductImageType[];
  category?: CategoryType | null;
  created_at: string;
  updated_at: string;
}

export interface CartItemType {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  price: number;
  selected_size?: string | null;
  selected_color?: string | null;
  product?: ProductType;
}

export interface OrderType {
  id: string;
  user_id: string;
  status: OrderStatus;
  total: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  customer_note?: string | null;
  payment_method: PaymentMethod;
  created_at: string;
  updated_at: string;
}

export interface ProfileType {
  profile_id: string;
  username?: string | null;
  avatar_url?: string | null;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export interface ProductFilters {
  categoryId?: string;
  size?: string;
  color?: string;
  inStock?: boolean;
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc";
}
