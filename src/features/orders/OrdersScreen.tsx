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
import { tokens } from "@/config/theme";
import type { OrderType } from "@/domain/types";

export function OrdersScreen() {
  const { user } = useAuth();
  const { data: orders, isLoading, refetch } = useOrders(user?.id ?? null);

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <EmptyState
          title="Sign in to see orders"
          actionLabel="Sign in"
          onAction={() => router.push("/(auth)/login")}
        />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg px-4 pt-6 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <FlatList
        data={(orders ?? []) as OrderType[]}
        keyExtractor={(o) => String(o.id)}
        contentContainerClassName="gap-3 px-4 pt-4 pb-6"
        ListHeaderComponent={
          <View className="mb-1">
            <Text variant="overline" className="text-muted">History</Text>
            <Text variant="h1">Your orders</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No orders yet"
            subtitle="Place your first order!"
            actionLabel="Shop now"
            onAction={() => router.push("/(tabs)/catalog")}
          />
        }
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#FAFAFA" />}
        renderItem={({ item: order }) => (
          <Pressable
            onPress={() => router.push(`/order/${order.id}` as any)}
            className="gap-2 bg-surface p-4 active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel={`Order #${order.id}`}
          >
            <View className="flex-row items-center justify-between">
              <Text variant="small" className="font-semibold">Order #{order.id}</Text>
              <Badge label={order.status} variant={orderStatusVariant(order.status)} />
            </View>
            <Text variant="caption" className="text-muted">
              {new Date(order.created_at).toLocaleDateString("vi-VN")}
            </Text>
            <View className="flex-row items-center justify-between">
              <Text variant="caption">
                {order.order_items?.length ?? 0} item(s)
              </Text>
              <View className="flex-row items-center gap-1">
                <Text variant="small" className="font-bold text-primary">{formatVnd(order.total)}</Text>
                <Feather name="chevron-right" size={16} color={tokens.color.muted} />
              </View>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
