import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWishlistIds, getWishlistProducts, addWishlist, removeWishlist } from "@/domain/services/wishlist";

const idsKey = (u: string | null) => ["wishlist", "ids", u];
const productsKey = (u: string | null) => ["wishlist", "products", u];

export function useWishlist(userId: string | null) {
  const qc = useQueryClient();

  const idsQuery = useQuery({
    queryKey: idsKey(userId),
    queryFn: () => getWishlistIds(userId as string),
    enabled: !!userId,
  });

  const ids = new Set(idsQuery.data ?? []);

  const mutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!userId) return;
      if (ids.has(productId)) await removeWishlist(userId, productId);
      else await addWishlist(userId, productId);
    },
    onMutate: async (productId: string) => {
      await qc.cancelQueries({ queryKey: idsKey(userId) });
      const prev = qc.getQueryData<string[]>(idsKey(userId)) ?? [];
      const next = prev.includes(productId) ? prev.filter((x) => x !== productId) : [...prev, productId];
      qc.setQueryData(idsKey(userId), next);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(idsKey(userId), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: idsKey(userId) });
      qc.invalidateQueries({ queryKey: productsKey(userId) });
    },
  });

  return {
    ids,
    has: (id: string) => ids.has(id),
    toggle: (id: string) => mutation.mutate(id),
    isLoading: idsQuery.isLoading,
  };
}

export function useWishlistProducts(userId: string | null) {
  return useQuery({
    queryKey: productsKey(userId),
    queryFn: () => getWishlistProducts(userId as string),
    enabled: !!userId,
  });
}
