import React from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useOrder } from "./hooks";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { Badge, orderStatusVariant } from "@/ui/Badge";
import { Skeleton } from "@/ui/Skeleton";
import { formatVnd } from "@/lib/currency";

const STATUS_STEPS = ["pending", "processing", "confirmed", "shipping", "delivered"];

export function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading, isError, refetch } = useOrder(id ? Number(id) : null);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg px-4 pt-6 gap-4">
        <Skeleton className="h-6 w-1/2 rounded" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </SafeAreaView>
    );
  }

  if (isError || !order) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg gap-4">
        <Text>Could not load order.</Text>
        <Button title="Retry" onPress={() => refetch()} />
        <Button title="Back" variant="ghost" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const stepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView contentContainerClassName="gap-4 px-4 pt-4 pb-8">
        <View className="flex-row items-center justify-between">
          <Text variant="h2">Order #{order.id}</Text>
          <Badge label={order.status} variant={orderStatusVariant(order.status)} />
        </View>

        {/* Status timeline */}
        <View className="rounded-lg bg-surface p-4 gap-3">
          <Text variant="small" className="font-semibold">Status</Text>
          <View className="flex-row items-center gap-1">
            {STATUS_STEPS.map((step, i) => (
              <React.Fragment key={step}>
                <View
                  className={`h-2 flex-1 rounded-pill ${i <= stepIndex ? "bg-primary" : "bg-border"}`}
                />
              </React.Fragment>
            ))}
          </View>
          <View className="flex-row justify-between">
            {STATUS_STEPS.map((step) => (
              <Text key={step} variant="caption" className="text-muted capitalize" style={{ fontSize: 9 }}>
                {step}
              </Text>
            ))}
          </View>
        </View>

        {/* Items — rendered from snapshots */}
        <View className="rounded-lg bg-surface p-4 gap-3">
          <Text variant="small" className="font-semibold">Items</Text>
          {(order.order_items ?? []).map((item) => (
            <View key={item.id} className="flex-row justify-between gap-2">
              <View className="flex-1">
                <Text variant="small" numberOfLines={2}>
                  {item.product_title_snapshot ?? item.product?.title ?? "Product"}
                </Text>
                {(item.size_snapshot || item.color_snapshot) && (
                  <Text variant="caption" className="text-muted">
                    {[item.size_snapshot, item.color_snapshot].filter(Boolean).join(" · ")}
                  </Text>
                )}
              </View>
              <View className="items-end">
                <Text variant="caption">× {item.quantity}</Text>
                <Text variant="small" className="font-semibold">{formatVnd(item.price * item.quantity)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Address */}
        {order.shipping_address && (
          <View className="rounded-lg bg-surface p-4 gap-1">
            <Text variant="small" className="font-semibold">Delivery to</Text>
            <Text variant="caption">{order.customer_name}</Text>
            <Text variant="caption">{order.customer_phone}</Text>
            <Text variant="caption">{order.shipping_address.street}, {order.shipping_address.city}</Text>
          </View>
        )}

        {/* Payment */}
        <View className="rounded-lg bg-surface p-4 gap-2">
          <Text variant="small" className="font-semibold">Payment</Text>
          <View className="flex-row justify-between">
            <Text variant="caption">Method</Text>
            <Text variant="caption">{order.payment_method === "cod" ? "Cash on delivery" : "Bank transfer"}</Text>
          </View>
          <View className="flex-row justify-between border-t border-border pt-2">
            <Text variant="small" className="font-bold">Total</Text>
            <Text variant="small" className="font-bold text-primary">{formatVnd(order.total)}</Text>
          </View>
        </View>

        <Button title="Back to orders" variant="secondary" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}
