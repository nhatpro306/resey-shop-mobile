import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/domain/services/keys";
import { getOrders, getOrderById, createOrder } from "@/domain/services/order";
import type { CheckoutPayload } from "@/domain/types";

export function useOrders(userId: string | null) {
  return useQuery({
    queryKey: qk.orders(userId ?? ""),
    queryFn: () => getOrders(userId!),
    enabled: !!userId,
    staleTime: 0,
  });
}

export function useOrder(orderId: number | null) {
  return useQuery({
    queryKey: qk.order(String(orderId ?? "")),
    queryFn: () => getOrderById(orderId!),
    enabled: !!orderId,
    staleTime: 30_000,
  });
}

export function usePlaceOrder(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CheckoutPayload) => createOrder(payload),
    onSuccess: () => {
      if (userId) {
        qc.invalidateQueries({ queryKey: qk.orders(userId) });
        qc.invalidateQueries({ queryKey: qk.cart(userId) });
      }
    },
  });
}
