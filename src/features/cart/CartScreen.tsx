import React from "react";
import { View, FlatList, Alert, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Image } from "expo-image";
import Feather from "@expo/vector-icons/Feather";
import { useQuery } from "@tanstack/react-query";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "./hooks";
import { useAuth } from "@/features/auth/AuthContext";
import { getStoreSettings } from "@/domain/services/settings";
import { qk } from "@/domain/services/keys";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { EmptyState } from "@/ui/EmptyState";
import { Skeleton } from "@/ui/Skeleton";
import { swatchHex } from "@/ui/Swatch";
import { formatVnd } from "@/lib/currency";
import { getResizedImageUrl } from "@/lib/imageUrl";
import { useThemeColors } from "@/config/theme";
import type { CartItemType } from "@/domain/types";

function SummaryLine({ label, value, accent, ok }: { label: string; value: string; accent?: boolean; ok?: boolean }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-[13.5px] text-fg-muted">{label}</Text>
      <Text className={`text-[13.5px] font-semibold ${accent ? "text-accent" : ok ? "text-ok" : "text-fg"}`}>{value}</Text>
    </View>
  );
}

export function CartScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const { data: cart, isLoading } = useCart(user?.id ?? null);
  const { data: settings } = useQuery({ queryKey: qk.storeSettings(), queryFn: getStoreSettings });
  const updateQty = useUpdateCartItem(user?.id ?? null);
  const removeItem = useRemoveCartItem(user?.id ?? null);

  const items: CartItemType[] = cart?.cart_items ?? [];
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const threshold = settings?.free_shipping_threshold ?? 0;
  const baseShip = settings?.shipping_fee ?? 0;
  const ship = subtotal === 0 || (threshold > 0 && subtotal >= threshold) ? 0 : baseShip;
  const total = subtotal + ship;
  const remaining = Math.max(0, threshold - subtotal);
  const pct = threshold > 0 ? Math.min(100, (subtotal / threshold) * 100) : 100;

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
        <EmptyState title="Đăng nhập để xem giỏ hàng" actionLabel="Đăng nhập" onAction={() => router.push("/(auth)/login")} />
      </SafeAreaView>
    );
  }
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 gap-4 bg-bg px-4 pt-6" edges={["top"]}>
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
      </SafeAreaView>
    );
  }
  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
        <View className="border-b border-border px-4 pb-4 pt-2">
          <Text variant="eyebrow">Giỏ</Text>
          <Text variant="h1" className="text-[28px]">Giỏ hàng</Text>
        </View>
        <View className="flex-1 items-center justify-center gap-4 px-10 -mt-12">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-surface-sunken">
            <Feather name="shopping-bag" size={34} color={c.fgSubtle} />
          </View>
          <Text variant="h2" className="text-xl">Giỏ hàng đang trống</Text>
          <Text variant="body" className="text-center text-sm">Chọn sản phẩm RESEY để bắt đầu.</Text>
          <Button title="Bắt đầu mua sắm" variant="primary" icon="arrow-right" onPress={() => router.push("/(tabs)/catalog")} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="border-b border-border px-4 pb-4 pt-2">
        <Text variant="eyebrow">Giỏ</Text>
        <Text variant="h1" className="text-[28px]">Giỏ hàng ({items.length})</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ paddingBottom: 220 }}
        ListHeaderComponent={
          threshold > 0 ? (
            <View className="mx-4 mb-1 mt-3 bg-surface-sunken p-4">
              <View className="mb-2.5 flex-row items-center gap-2.5">
                <Feather name="truck" size={17} color={remaining === 0 ? c.ok : c.fg} />
                <Text className="text-xs font-semibold text-fg">
                  {remaining === 0 ? "Bạn được miễn phí vận chuyển!" : `Mua thêm ${formatVnd(remaining)} để được miễn phí ship`}
                </Text>
              </View>
              <View className="h-1 overflow-hidden bg-border">
                <View className="h-full" style={{ width: `${pct}%`, backgroundColor: remaining === 0 ? c.ok : c.ink }} />
              </View>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View className="mx-4 flex-row gap-3.5 border-b border-border py-4">
            <Pressable onPress={() => item.product?.slug && router.push(`/product/${item.product.slug}` as any)} className="bg-img-bg" style={{ width: 86, height: 110 }} accessibilityRole="button" accessibilityLabel={`Xem ${item.product?.title ?? "sản phẩm"}`}>
              {item.product?.image ? (
                <Image source={getResizedImageUrl(item.product.image, 200)} style={{ width: "100%", height: "100%" }} contentFit="cover" cachePolicy="memory-disk" />
              ) : null}
            </Pressable>
            <View className="flex-1">
              <View className="flex-row justify-between gap-2">
                <Text variant="cardtitle" className="flex-1 text-[12.5px]" numberOfLines={2}>{item.product?.title ?? "Sản phẩm"}</Text>
                <Pressable onPress={() => Alert.alert("Xoá sản phẩm?", "", [{ text: "Huỷ", style: "cancel" }, { text: "Xoá", style: "destructive", onPress: () => removeItem.mutate(item.id) }])} hitSlop={8} accessibilityRole="button" accessibilityLabel="Xoá sản phẩm khỏi giỏ">
                  <Feather name="trash-2" size={16} color={c.fgSubtle} />
                </Pressable>
              </View>
              {item.selected_size || item.selected_color ? (
                <View className="mt-1.5 flex-row items-center gap-1.5">
                  {item.selected_color ? <View className="h-[11px] w-[11px] rounded-full" style={{ backgroundColor: swatchHex(item.selected_color), borderWidth: 1, borderColor: "rgba(0,0,0,0.15)" }} /> : null}
                  <Text className="text-[11.5px] text-fg-subtle">{[item.selected_color, item.selected_size].filter(Boolean).join(" · ")}</Text>
                </View>
              ) : null}
              <View className="flex-1" />
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center border border-border">
                  <Pressable onPress={() => updateQty.mutate({ itemId: item.id, quantity: item.quantity - 1 })} disabled={item.quantity <= 1} className="h-11 w-11 items-center justify-center" accessibilityRole="button" accessibilityLabel="Giảm số lượng" accessibilityState={{ disabled: item.quantity <= 1 }}><Feather name="minus" size={15} color={item.quantity <= 1 ? c.fgFaint : c.fg} /></Pressable>
                  <Text className="w-8 text-center text-[13px] font-bold text-fg">{item.quantity}</Text>
                  <Pressable onPress={() => updateQty.mutate({ itemId: item.id, quantity: item.quantity + 1 })} className="h-11 w-11 items-center justify-center" accessibilityRole="button" accessibilityLabel="Tăng số lượng"><Feather name="plus" size={15} color={c.fg} /></Pressable>
                </View>
                <Text className="text-sm font-bold text-fg">{formatVnd(item.price * item.quantity)}</Text>
              </View>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View className="mx-4 mt-5 gap-3">
            <SummaryLine label="Tạm tính" value={formatVnd(subtotal)} />
            <SummaryLine label="Phí ship" value={ship === 0 ? "Miễn phí" : formatVnd(ship)} ok={ship === 0} />
          </View>
        }
      />

      {/* sticky checkout */}
      <View className="absolute inset-x-0 bottom-0 border-t border-border bg-bg px-4 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <View className="mb-2.5 flex-row items-baseline justify-between">
          <Text className="text-[11px] font-bold uppercase tracking-[0.14em] text-fg-subtle">Tổng</Text>
          <Text className="text-[19px] font-extrabold text-fg">{formatVnd(total)}</Text>
        </View>
        <Button title="Thanh toán" variant="primary" full icon="arrow-right" onPress={() => router.push("/checkout" as any)} />
      </View>
    </SafeAreaView>
  );
}
