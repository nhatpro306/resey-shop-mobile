import type { ProductFilters } from "@/domain/types";

// Central query-key registry. Keep shapes identical to the web app for parity.
export const qk = {
  products: (filters: ProductFilters = {}) => ["products", filters] as const,
  product: (slug: string) => ["product", slug] as const,
  categories: () => ["categories"] as const,
  cart: (userId: string) => ["cart", userId] as const,
  orders: (userId: string) => ["orders", userId] as const,
  order: (id: string) => ["order", id] as const,
  profile: (userId: string) => ["profile", userId] as const,
  storeSettings: () => ["store-settings"] as const,
};
