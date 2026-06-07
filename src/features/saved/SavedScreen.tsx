import React from "react";
import { View, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { useAuth } from "@/features/auth/AuthContext";
import { useWishlist, useWishlistProducts } from "./hooks";
import { ProductCard } from "@/ui/ProductCard";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { EmptyState } from "@/ui/EmptyState";
import { Skeleton } from "@/ui/Skeleton";
import { useThemeColors } from "@/config/theme";
import type { ProductType } from "@/domain/types";

export function SavedScreen() {
  const { user } = useAuth();
  const c = useThemeColors();
  const wishlist = useWishlist(user?.id ?? null);
  const { data, isLoading, isError, refetch } = useWishlistProducts(user?.id ?? null);
  const items = (data ?? []) as ProductType[];

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
        <EmptyState title="Đăng nhập để xem yêu thích" actionLabel="Đăng nhập" onAction={() => router.push("/(auth)/login")} />
      </SafeAreaView>
    );
  }
  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
        <EmptyState title="Không tải được danh sách yêu thích" subtitle="Vui lòng kiểm tra kết nối và thử lại." actionLabel="Thử lại" onAction={() => refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="border-b border-border px-4 pb-4 pt-2">
        <Text variant="eyebrow">Yêu thích</Text>
        <Text variant="h1" className="text-[28px]">Đã lưu{items.length ? ` (${items.length})` : ""}</Text>
      </View>

      {isLoading ? (
        <View className="flex-row flex-wrap gap-3 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} className="basis-[47%]"><Skeleton className="w-full" style={{ aspectRatio: 3 / 4 }} /></View>
          ))}
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-4 px-10 -mt-12">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-surface-sunken">
            <Feather name="heart" size={32} color={c.fgSubtle} />
          </View>
          <Text variant="h2" className="text-xl">Chưa có sản phẩm yêu thích</Text>
          <Text variant="body" className="text-center text-sm">Chạm vào trái tim để lưu sản phẩm.</Text>
          <Button title="Bắt đầu mua sắm" variant="primary" icon="arrow-right" onPress={() => router.push("/(tabs)/catalog")} />
        </View>
      ) : (
        <FlatList
          data={items}
          numColumns={2}
          keyExtractor={(p) => p.product_id}
          contentContainerStyle={{ padding: 16 }}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          renderItem={({ item }) => (
            <View style={{ width: "48%", marginBottom: 16 }}>
              <ProductCard
                product={item}
                saved={wishlist.has(item.product_id)}
                onToggleSave={() => wishlist.toggle(item.product_id)}
                onPress={() => router.push(`/product/${item.slug}` as any)}
              />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
