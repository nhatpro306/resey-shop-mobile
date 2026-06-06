import React from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { useOrder } from "./hooks";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { Badge, orderStatusVariant } from "@/ui/Badge";
import { Skeleton } from "@/ui/Skeleton";
import { formatVnd } from "@/lib/currency";
import { useThemeColors } from "@/config/theme";

const STATUS_STEPS = ["pending", "processing", "confirmed", "shipping", "delivered"];
const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xử lý",
  processing: "Xử lý",
  confirmed: "Xác nhận",
  shipping: "Vận chuyển",
  delivered: "Đã giao",
};
const STATUS_BADGE_VI: Record<string, string> = {
  pending: "Chờ xác nhận", processing: "Đang đóng gói", confirmed: "Đã xác nhận",
  shipped: "Đang giao", shipping: "Đang giao", delivered: "Hoàn thành", completed: "Hoàn thành", cancelled: "Đã huỷ",
};

export function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading, isError, refetch } = useOrder(id ? Number(id) : null);
  const c = useThemeColors();

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
        <Text>Không tải được đơn hàng.</Text>
        <Button title="Thử lại" onPress={() => refetch()} />
        <Button title="Quay lại" variant="ghost" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const stepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border px-4 pb-3 pt-4">
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-9 w-9 items-center justify-center" accessibilityLabel="Quay lại">
          <Feather name="chevron-left" size={24} color={c.fg} />
        </Pressable>
        <Text variant="h2" className="flex-1 pr-9 text-center text-base">Đơn hàng #{order.id}</Text>
      </View>

      <ScrollView contentContainerClassName="gap-4 px-4 pt-4 pb-8">
        {/* Status badge */}
        <View className="items-start">
          <Badge label={STATUS_BADGE_VI[order.status] ?? order.status} variant={orderStatusVariant(order.status)} />
        </View>

        {/* Status timeline */}
        <View className="rounded-lg bg-surface p-4 gap-3">
          <Text variant="overline" className="text-muted">Trạng thái</Text>
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
              <Text key={step} variant="caption" className="text-muted" style={{ fontSize: 9 }}>
                {STATUS_LABELS[step] ?? step}
              </Text>
            ))}
          </View>
        </View>

        {/* Items — rendered from snapshots */}
        <View className="rounded-lg bg-surface p-4 gap-3">
          <Text variant="overline" className="text-muted">Sản phẩm</Text>
          {(order.order_items ?? []).map((item) => (
            <View key={item.id} className="flex-row justify-between gap-2">
              <View className="flex-1">
                <Text variant="small" numberOfLines={2}>
                  {item.product_title_snapshot ?? item.product?.title ?? "Sản phẩm"}
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
            <Text variant="overline" className="text-muted">Giao đến</Text>
            <Text variant="caption">{order.customer_name}</Text>
            <Text variant="caption">{order.customer_phone}</Text>
            <Text variant="caption">{order.shipping_address.street}, {order.shipping_address.city}</Text>
          </View>
        )}

        {/* Payment */}
        <View className="rounded-lg bg-surface p-4 gap-2">
          <Text variant="overline" className="text-muted">Thanh toán</Text>
          <View className="flex-row justify-between">
            <Text variant="caption">Phương thức</Text>
            <Text variant="caption">{order.payment_method === "cod" ? "Thanh toán khi nhận hàng" : "Chuyển khoản ngân hàng"}</Text>
          </View>
          <View className="flex-row justify-between border-t border-border pt-2">
            <Text variant="small" className="font-bold">Tổng</Text>
            <Text variant="small" className="font-bold text-primary">{formatVnd(order.total)}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
