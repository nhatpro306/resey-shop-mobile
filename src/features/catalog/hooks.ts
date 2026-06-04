import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { qk } from "@/domain/services/keys";
import { listProducts, getProductBySlug, searchProducts } from "@/domain/services/product";
import { getCategories } from "@/domain/services/category";
import type { ProductFilters } from "@/domain/types";
import type { Cursor } from "@/domain/pagination";

export function useProducts(filters: ProductFilters = {}) {
  return useInfiniteQuery({
    queryKey: qk.products(filters),
    queryFn: ({ pageParam }) => listProducts(filters, (pageParam as Cursor | null) ?? null),
    initialPageParam: null as Cursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 60_000,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: qk.product(slug),
    queryFn: () => getProductBySlug(slug),
    enabled: !!slug,
    staleTime: 60_000,
  });
}

export function useProductSearch(query: string) {
  return useQuery({
    queryKey: ["product-search", query],
    queryFn: () => searchProducts(query),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: qk.categories(),
    queryFn: getCategories,
    staleTime: 5 * 60_000,
  });
}
