import React, { useState } from "react";
import { View, FlatList, Pressable, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminListOrders, adminUpdateOrderStatus } from "@/domain/services/admin/order";
import { Text } from "@/ui/Text";
import { Badge, orderStatusVariant } from "@/ui/Badge";
import { Skeleton } from "@/ui/Skeleton";
import { Button } from "@/ui/Button";
import { formatVnd } from "@/lib/currency";
import type { OrderStatus } from "@/domain/types";
import type { AppError } from "@/domain/errors";

const STATUSES: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "processing", label: "Processing" },
  { key: "shipping", label: "Shipping" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

const NEXT_STATUSES: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ["processing", "cancelled"],
  processing: ["confirmed", "cancelled"],
  confirmed: ["shipping", "cancelled"],
  shipping: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
};

export function AdminOrdersScreen() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-orders", statusFilter, page],
    queryFn: () => adminListOrders({ status: statusFilter || undefined }, page, 30),
    staleTime: 15_000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: OrderStatus }) =>
      adminUpdateOrderStatus(orderId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
    onError: (e) => Alert.alert("Error", (e as AppError).message),
  });

  function handleStatusChange(orderId: number, currentStatus: OrderStatus) {
    const next = NEXT_STATUSES[currentStatus] ?? [];
    if (next.length === 0) return;
    Alert.alert(
      "Change status",
      `Order #${orderId}`,
      [
        ...next.map((s) => ({
          text: s.charAt(0).toUpperCase() + s.slice(1),
          onPress: () => updateStatus.mutate({ orderId, status: s }),
        })),
        { text: "Cancel", style: "cancel" as const },
      ],
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-4 pt-4 pb-2">
        <Text variant="h2" className="mb-2">Orders</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUSES}
          keyExtractor={(s) => s.key}
          contentContainerClassName="gap-2"
          renderItem={({ item: s }) => (
            <Pressable
              onPress={() => { setStatusFilter(s.key); setPage(1); }}
              className={`rounded-pill border px-3 py-1 ${
                statusFilter === s.key ? "border-primary bg-primary" : "border-border bg-surface"
              }`}
              accessibilityRole="button"
            >
              <Text variant="caption" className={statusFilter === s.key ? "text-primary-fg font-semibold" : ""}>
                {s.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {isLoading ? (
        <View className="px-4 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </View>
      ) : (
        <FlatList
          data={data?.orders ?? []}
          keyExtractor={(o) => String(o.id)}
          contentContainerClassName="gap-2 px-4 pb-6"
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#FAFAFA" />}
          renderItem={({ item: order }) => (
            <View className="rounded-lg bg-surface p-3 gap-2">
              <Pressable
                onPress={() => router.push(`/order/${order.id}` as any)}
                className="gap-2 active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel={`Order #${order.id}`}
              >
                <View className="flex-row items-center justify-between">
                  <Text variant="small" className="font-semibold">#{order.id} — {order.customer_name ?? "Customer"}</Text>
                  <Badge label={order.status} variant={orderStatusVariant(order.status)} />
                </View>
                <View className="flex-row items-center justify-between">
                  <Text variant="caption" className="text-muted">
                    {new Date(order.created_at).toLocaleDateString("vi-VN")}
                  </Text>
                  <Text variant="small" className="font-semibold text-primary">{formatVnd(order.total)}</Text>
                </View>
              </Pressable>
              {NEXT_STATUSES[order.status as OrderStatus]?.length ? (
                <Button
                  title="Change status"
                  variant="secondary"
                  className="h-8 self-start px-3"
                  onPress={() => handleStatusChange(order.id, order.status as OrderStatus)}
                />
              ) : null}
            </View>
          )}
          ListFooterComponent={
            data && data.total > 30 ? (
              <View className="flex-row justify-center gap-4 pt-2">
                {page > 1 && <Button title="← Prev" variant="ghost" onPress={() => setPage((p) => p - 1)} />}
                {data.orders.length === 30 && (
                  <Button title="Next →" variant="ghost" onPress={() => setPage((p) => p + 1)} />
                )}
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
