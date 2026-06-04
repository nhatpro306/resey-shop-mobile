import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/domain/services/keys";
import {
  getOrCreateCart, getCartItems, addItemToCart,
  updateCartItemQuantity, removeCartItem, clearCart,
} from "@/domain/services/cart";
import type { CartVariantOptions } from "@/domain/services/cart";
import type { CartItemType, CartType } from "@/domain/types";

export function useCart(userId: string | null) {
  return useQuery({
    queryKey: qk.cart(userId ?? ""),
    queryFn: async () => {
      if (!userId) return null;
      const cart = await getOrCreateCart(userId);
      const items = cart ? await getCartItems(cart.id) : [];
      return { ...cart, cart_items: items } as CartType;
    },
    enabled: !!userId,
    staleTime: 0,
  });
}

export function useAddToCart(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId, price, quantity, opts,
    }: { productId: string; price: number; quantity?: number; opts?: CartVariantOptions }) => {
      if (!userId) throw new Error("AUTH_REQUIRED");
      const cart = await getOrCreateCart(userId);
      return addItemToCart(cart.id, productId, price, quantity, opts);
    },
    onSuccess: () => {
      if (userId) qc.invalidateQueries({ queryKey: qk.cart(userId) });
    },
  });
}

export function useUpdateCartItem(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      updateCartItemQuantity(itemId, quantity),
    onMutate: async ({ itemId, quantity }) => {
      if (!userId) return;
      const key = qk.cart(userId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<CartType>(key);
      if (prev?.cart_items) {
        qc.setQueryData<CartType>(key, {
          ...prev,
          cart_items: quantity <= 0
            ? prev.cart_items.filter((i: CartItemType) => i.id !== itemId)
            : prev.cart_items.map((i: CartItemType) =>
                i.id === itemId ? { ...i, quantity } : i,
              ),
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (userId && ctx?.prev) qc.setQueryData(qk.cart(userId), ctx.prev);
    },
    onSettled: () => {
      if (userId) qc.invalidateQueries({ queryKey: qk.cart(userId) });
    },
  });
}

export function useRemoveCartItem(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: number) => removeCartItem(itemId),
    onMutate: async (itemId) => {
      if (!userId) return;
      const key = qk.cart(userId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<CartType>(key);
      if (prev?.cart_items) {
        qc.setQueryData<CartType>(key, {
          ...prev,
          cart_items: prev.cart_items.filter((i: CartItemType) => i.id !== itemId),
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (userId && ctx?.prev) qc.setQueryData(qk.cart(userId), ctx.prev);
    },
    onSettled: () => {
      if (userId) qc.invalidateQueries({ queryKey: qk.cart(userId) });
    },
  });
}

export function useClearCart(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cartId: number) => clearCart(cartId),
    onSuccess: () => {
      if (userId) qc.invalidateQueries({ queryKey: qk.cart(userId) });
    },
  });
}
