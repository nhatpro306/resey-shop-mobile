// Domain models — framework-free, portable. Mirrors the web app's types.ts.

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
export type UserRole = "admin" | "user";

export interface CategoryType {
  id: number;
  name: string;
  description?: string | null;
  parent_id?: number | null;
}

export interface ProductImageType {
  id: number;
  product_id: string;
  url: string;
  alt_text?: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductVariantType {
  id: number;
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
  category_id?: number | null;
  variants?: ProductVariantType[];
  images?: ProductImageType[];
  category?: CategoryType | null;
  created_at: string;
  updated_at: string;
}

export interface CartItemType {
  id: number;
  cart_id: number;
  product_id: string;
  variant_id?: number | null;
  quantity: number;
  price: number;
  selected_size?: string | null;
  selected_color?: string | null;
  variant_info?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  product?: ProductType;
}

export interface CartType {
  id: number;
  user_id: string;
  status: CartStatus;
  total_items?: number;
  total_price?: number;
  created_at: string;
  updated_at: string;
  cart_items?: CartItemType[];
}

export interface OrderItemType {
  id: number;
  order_id: number;
  product_id: string;
  variant_id?: number | null;
  quantity: number;
  price: number;
  selected_size?: string | null;
  selected_color?: string | null;
  variant_info?: Record<string, unknown>;
  product_title_snapshot?: string | null;
  product_image_snapshot?: string | null;
  sku_snapshot?: string | null;
  size_snapshot?: string | null;
  color_snapshot?: string | null;
  product?: Partial<ProductType>;
}

export interface OrderType {
  id: number;
  user_id: string;
  status: OrderStatus;
  total: number;
  shipping_address_id?: number | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  customer_note?: string | null;
  payment_method: PaymentMethod;
  payment_id?: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItemType[];
  shipping_address?: AddressType;
}

export interface ProfileType {
  profile_id: string;
  username?: string | null;
  avatar_url?: string | null;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddressType {
  id: number;
  user_id: string;
  street: string;
  city: string;
  state?: string;
  zip_code?: string;
  country: string;
  is_default: boolean;
  created_at?: string;
}

export interface ReviewType {
  id: number;
  product_id: string;
  user_id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  updated_at?: string;
  profile?: ProfileType;
}

export interface StoreSettingsType {
  id?: number;
  store_name?: string | null;
  store_logo?: string | null;
  store_description?: string | null;
  hero_title?: string | null;
  hero_subtitle?: string | null;
  hero_image?: string | null;
  hero_cta_text?: string | null;
  hero_cta_link?: string | null;
  social_facebook?: string | null;
  social_instagram?: string | null;
  social_tiktok?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_address?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_name?: string | null;
  shipping_fee?: number | null;
  free_shipping_threshold?: number | null;
  updated_at?: string | null;
}

export interface ProductFilters {
  categoryId?: number;
  size?: string;
  color?: string;
  inStock?: boolean;
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc";
}

export interface CheckoutPayload {
  cartId?: number;
  shippingAddressId: number;
  paymentMethod: PaymentMethod;
  paymentId?: string;
  shippingFee?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerNote?: string;
  items: CheckoutItem[];
}

export interface CheckoutItem {
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  selected_size?: string | null;
  selected_color?: string | null;
}
