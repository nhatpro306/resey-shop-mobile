import React from "react";
import { View, FlatList, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Image } from "expo-image";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "./hooks";
import { useAuth } from "@/features/auth/AuthContext";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { EmptyState } from "@/ui/EmptyState";
import { Skeleton } from "@/ui/Skeleton";
import { formatVnd } from "@/lib/currency";
import { getResizedImageUrl } from "@/domain/services/storage";
import type { CartItemType } from "@/domain/types";

export function CartScreen() {
  const { user } = useAuth();
  const { data: cart, isLoading } = useCart(user?.id ?? null);
  const updateQty = useUpdateCartItem(user?.id ?? null);
  const removeItem = useRemoveCartItem(user?.id ?? null);

  const items: CartItemType[] = cart?.cart_items ?? [];
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <EmptyState
          title="Sign in to view your cart"
          actionLabel="Sign in"
          onAction={() => router.push("/(auth)/login")}
        />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg px-4 pt-6 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <EmptyState
          title="Your cart is empty"
          subtitle="Add some products to get started."
          actionLabel="Browse catalog"
          onAction={() => router.push("/(tabs)/catalog")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        contentContainerClassName="px-4 pt-4 gap-3"
        renderItem={({ item }) => (
          <View className="flex-row gap-3 rounded-lg bg-surface p-3">
            {item.product?.image && (
              <Image
                source={getResizedImageUrl(item.product.image, 160)}
                style={{ width: 64, height: 64, borderRadius: 8 }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            )}
            <View className="flex-1 gap-1">
              <Text variant="small" className="font-semibold" numberOfLines={2}>
                {item.product?.title ?? "Product"}
              </Text>
              {(item.selected_size || item.selected_color) && (
                <Text variant="caption" className="text-muted">
                  {[item.selected_size, item.selected_color].filter(Boolean).join(" · ")}
                </Text>
              )}
              <Text variant="small" className="font-bold text-primary">{formatVnd(item.price)}</Text>
              {/* Qty stepper */}
              <View className="flex-row items-center gap-3">
                <Button
                  title="-"
                  variant="ghost"
                  className="h-7 w-7 rounded border border-border p-0"
                  onPress={() => updateQty.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                />
                <Text variant="small">{item.quantity}</Text>
                <Button
                  title="+"
                  variant="ghost"
                  className="h-7 w-7 rounded border border-border p-0"
                  onPress={() => updateQty.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                />
                <Button
                  title="Remove"
                  variant="ghost"
                  className="h-7 px-2"
                  onPress={() =>
                    Alert.alert("Remove item?", "", [
                      { text: "Cancel", style: "cancel" },
                      { text: "Remove", style: "destructive", onPress: () => removeItem.mutate(item.id) },
                    ])
                  }
                />
              </View>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View className="gap-2 pb-4 pt-2">
            <View className="flex-row justify-between">
              <Text variant="small" className="text-muted">Subtotal</Text>
              <Text variant="small" className="font-semibold">{formatVnd(total)}</Text>
            </View>
          </View>
        }
      />

      {/* Sticky checkout */}
      <View className="border-t border-border bg-bg px-4 py-3">
        <View className="mb-2 flex-row justify-between">
          <Text variant="body" className="font-semibold">Total</Text>
          <Text variant="body" className="font-bold text-primary">{formatVnd(total)}</Text>
        </View>
        <Button
          title="Proceed to checkout"
          onPress={() => router.push("/checkout" as any)}
        />
      </View>
    </SafeAreaView>
  );
}
