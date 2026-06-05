import React from "react";
import { View, FlatList, Alert, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Image } from "expo-image";
import Feather from "@expo/vector-icons/Feather";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "./hooks";
import { useAuth } from "@/features/auth/AuthContext";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { EmptyState } from "@/ui/EmptyState";
import { Skeleton } from "@/ui/Skeleton";
import { formatVnd } from "@/lib/currency";
import { getResizedImageUrl } from "@/lib/imageUrl";
import { tokens } from "@/config/theme";
import type { CartItemType } from "@/domain/types";

export function CartScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
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
      <SafeAreaView className="flex-1 gap-4 bg-bg px-4 pt-6">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
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
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-4 pt-4">
        <Text variant="overline" className="text-muted">Your cart</Text>
        <Text variant="h1">Cart ({items.length})</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        contentContainerClassName="gap-3 px-4 pt-4"
        renderItem={({ item }) => (
          <View className="flex-row gap-3 bg-surface p-3">
            {item.product?.image ? (
              <Image
                source={getResizedImageUrl(item.product.image, 160)}
                style={{ width: 72, height: 72 }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : null}
            <View className="flex-1 gap-1.5">
              <View className="flex-row items-start gap-2">
                <Text variant="small" className="flex-1 font-semibold" numberOfLines={2}>
                  {item.product?.title ?? "Product"}
                </Text>
                <Pressable
                  onPress={() =>
                    Alert.alert("Remove item?", "", [
                      { text: "Cancel", style: "cancel" },
                      { text: "Remove", style: "destructive", onPress: () => removeItem.mutate(item.id) },
                    ])
                  }
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Remove item"
                >
                  <Feather name="trash-2" size={16} color={tokens.color.muted} />
                </Pressable>
              </View>
              {(item.selected_size || item.selected_color) ? (
                <Text variant="caption" className="text-muted">
                  {[item.selected_size, item.selected_color].filter(Boolean).join(" · ")}
                </Text>
              ) : null}
              <View className="flex-row items-center justify-between">
                <Text variant="small" className="font-bold text-primary">{formatVnd(item.price)}</Text>
                <View className="flex-row items-center border border-border">
                  <Pressable
                    onPress={() => updateQty.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                    className="h-9 w-9 items-center justify-center"
                    accessibilityRole="button"
                    accessibilityLabel="Decrease quantity"
                  >
                    <Feather name="minus" size={14} color={tokens.color.text} />
                  </Pressable>
                  <Text variant="small" className="w-8 text-center font-semibold">{item.quantity}</Text>
                  <Pressable
                    onPress={() => updateQty.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                    className="h-9 w-9 items-center justify-center"
                    accessibilityRole="button"
                    accessibilityLabel="Increase quantity"
                  >
                    <Feather name="plus" size={14} color={tokens.color.text} />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        )}
      />

      {/* Sticky checkout */}
      <View
        className="border-t border-border bg-bg px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <View className="mb-2 flex-row justify-between">
          <Text variant="body" className="font-semibold">Total</Text>
          <Text variant="body" className="font-bold text-primary">{formatVnd(total)}</Text>
        </View>
        <Button title="Proceed to checkout" onPress={() => router.push("/checkout" as any)} />
      </View>
    </SafeAreaView>
  );
}
