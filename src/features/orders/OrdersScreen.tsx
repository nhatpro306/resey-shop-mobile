import React from "react";
import { FlatList, RefreshControl, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { useOrders } from "./hooks";
import { useAuth } from "@/features/auth/AuthContext";
import { Text } from "@/ui/Text";
import { Badge, orderStatusVariant } from "@/ui/Badge";
import { EmptyState } from "@/ui/EmptyState";
import { Skeleton } from "@/ui/Skeleton";
import { formatVnd } from "@/lib/currency";
import { useThemeColors } from "@/config/theme";
import type { OrderType } from "@/domain/types";

const STATUS_VI: Record<string, string> = {
  pending: "Chờ xác nhận", processing: "Đang đóng gói", confirmed: "Đã xác nhận",
  shipped: "Đang giao", shipping: "Đang giao", delivered: "Hoàn thành", completed: "Hoàn thành", cancelled: "Đã huỷ",
};

export function OrdersScreen() {
  const { user } = useAuth();
  const c = useThemeColors();
  const { data: orders, isLoading, isError, refetch } = useOrders(user?.id ?? null);

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
        <EmptyState title="Đăng nhập để xem đơn hàng" actionLabel="Đăng nhập" onAction={() => router.push("/(auth)/login")} />
      </SafeAreaView>
    );
  }
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 gap-3 bg-bg px-4 pt-6" edges={["top"]}>
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </SafeAreaView>
    );
  }
  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
        <EmptyState title="Không tải được đơn hàng" subtitle="Vui lòng kiểm tra kết nối và thử lại." actionLabel="Thử lại" onAction={() => refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <FlatList
        data={(orders ?? []) as OrderType[]}
        keyExtractor={(o) => String(o.id)}
        contentContainerClassName="gap-3 px-4 pb-6 pt-4"
        ListHeaderComponent={
          <View className="mb-1">
            <Text variant="eyebrow">Lịch sử</Text>
            <Text variant="h1" className="text-[28px]">Đơn hàng</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState title="Chưa có đơn hàng" subtitle="Đặt đơn đầu tiên của bạn!" actionLabel="Mua sắm ngay" onAction={() => router.push("/(tabs)/catalog")} />
        }
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={c.fg} />}
        renderItem={({ item: order }) => (
          <Pressable
            onPress={() => router.push(`/order/${order.id}` as any)}
            className="gap-2 border border-border bg-surface p-4 active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel={`Đơn #${order.id}`}
          >
            <View className="flex-row items-center justify-between">
              <Text variant="cardtitle" className="text-[13px]">Đơn #{order.id}</Text>
              <Badge label={STATUS_VI[order.status] ?? order.status} variant={orderStatusVariant(order.status)} />
            </View>
            <Text className="text-xs text-fg-subtle">{new Date(order.created_at).toLocaleDateString("vi-VN")}</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-fg-muted">{order.order_items?.length ?? 0} sản phẩm</Text>
              <View className="flex-row items-center gap-1">
                <Text className="text-sm font-bold text-accent">{formatVnd(order.total)}</Text>
                <Feather name="chevron-right" size={16} color={c.fgSubtle} />
              </View>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
