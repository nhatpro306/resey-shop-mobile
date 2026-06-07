import React from "react";
import { View, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { adminGetDashboard } from "@/domain/services/admin/order";
import { adminGetProductAnalytics } from "@/domain/services/admin/product";
import { useAuth } from "@/features/auth/AuthContext";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { Badge, orderStatusVariant } from "@/ui/Badge";
import { Skeleton } from "@/ui/Skeleton";
import { EmptyState } from "@/ui/EmptyState";
import { formatVnd } from "@/lib/currency";

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View className="flex-1 rounded-lg bg-surface p-4 gap-1">
      <Text variant="caption" className="text-muted">{label}</Text>
      <Text variant="h2" className="font-bold">{String(value)}</Text>
    </View>
  );
}

export function AdminDashboardScreen() {
  const { isAdmin } = useAuth();

  const { data: dash, isLoading: dashLoading, refetch } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: adminGetDashboard,
    staleTime: 30_000,
  });

  const { data: productStats, isLoading: prodLoading } = useQuery({
    queryKey: ["admin-product-analytics"],
    queryFn: adminGetProductAnalytics,
    staleTime: 60_000,
  });

  if (!isAdmin) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <EmptyState title="Access denied" subtitle="Admin only." actionLabel="Go back" onAction={() => router.back()} />
      </SafeAreaView>
    );
  }

  const isLoading = dashLoading || prodLoading;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView
        contentContainerClassName="gap-4 px-4 pt-4 pb-8"
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#FAFAFA" />}
      >
        <Text variant="h1">Admin</Text>

        {/* KPI row */}
        {isLoading ? (
          <View className="flex-row gap-3">
            <Skeleton className="flex-1 h-20 rounded-lg" />
            <Skeleton className="flex-1 h-20 rounded-lg" />
            <Skeleton className="flex-1 h-20 rounded-lg" />
          </View>
        ) : (
          <View className="flex-row gap-3">
            <KpiCard label="Total orders" value={dash?.totalOrders ?? 0} />
            <KpiCard label="Today" value={dash?.todayOrders ?? 0} />
            <KpiCard label="Revenue today" value={formatVnd(dash?.todayRevenue ?? 0)} />
          </View>
        )}

        <View className="flex-row gap-3">
          <KpiCard label="Pending" value={dash?.ordersByStatus?.pending ?? 0} />
          <KpiCard label="Processing" value={dash?.ordersByStatus?.processing ?? 0} />
          <KpiCard label="Low stock" value={productStats?.lowStockCount ?? 0} />
        </View>

        {/* Nav */}
        <View className="flex-row gap-3 flex-wrap">
          {[
            { label: "Products", route: "/(admin)/products" },
            { label: "Orders", route: "/(admin)/orders" },
            { label: "Users", route: "/(admin)/users" },
            { label: "Settings", route: "/(admin)/settings" },
          ].map((item) => (
            <Button
              key={item.label}
              title={item.label}
              variant="secondary"
              className="flex-1 basis-5/12"
              onPress={() => router.push(item.route as any)}
            />
          ))}
        </View>

        {/* Recent orders */}
        {(dash?.recentOrders ?? []).length > 0 && (
          <View className="gap-2">
            <Text variant="small" className="font-semibold">Recent orders</Text>
            {dash!.recentOrders.map((o) => (
              <Pressable key={o.id} onPress={() => router.push(`/order/${o.id}` as any)} className="rounded-lg bg-surface px-4 py-3 flex-row justify-between items-center active:opacity-80" accessibilityRole="button">
                <View>
                  <Text variant="small">#{o.id} — {o.customer_name ?? "Customer"}</Text>
                  <Text variant="caption" className="text-muted">
                    {new Date(o.created_at).toLocaleDateString("vi-VN")}
                  </Text>
                </View>
                <View className="items-end gap-1">
                  <Badge label={o.status} variant={orderStatusVariant(o.status)} />
                  <Text variant="caption" className="text-primary font-semibold">{formatVnd(o.total)}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
