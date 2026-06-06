import React from "react";
import { ScrollView, View, Pressable, RefreshControl, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Image } from "expo-image";
import Feather from "@expo/vector-icons/Feather";
import { useQuery } from "@tanstack/react-query";
import { getStoreSettings } from "@/domain/services/settings";
import { qk } from "@/domain/services/keys";
import { useProducts, useCategories } from "@/features/catalog/hooks";
import { useAuth } from "@/features/auth/AuthContext";
import { useWishlist } from "@/features/saved/hooks";
import { ProductCard } from "@/ui/ProductCard";
import { Skeleton } from "@/ui/Skeleton";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { SectionHeader } from "@/ui/SectionHeader";
import { useThemeColors } from "@/config/theme";
import { getResizedImageUrl } from "@/lib/imageUrl";
import { formatVnd } from "@/lib/currency";
import type { ProductType } from "@/domain/types";

export function HomeScreen() {
  const c = useThemeColors();
  const { user } = useAuth();
  const wishlist = useWishlist(user?.id ?? null);
  const { data: settings } = useQuery({ queryKey: qk.storeSettings(), queryFn: getStoreSettings, staleTime: 5 * 60_000 });
  const { data, isLoading, refetch } = useProducts({ sort: "newest" });
  const { data: categories } = useCategories();

  const products: ProductType[] = data?.pages.flatMap((p) => p.items) ?? [];
  const newest = products.slice(0, 4);
  const best = products.slice(0, 8);
  const collections = (categories ?? []).slice(0, 6);

  function goCatalog() { router.push("/(tabs)/catalog"); }
  function goCollection(categoryId: number) { router.push(`/(tabs)/catalog?category=${categoryId}` as any); }
  const freeShipThreshold = settings?.free_shipping_threshold ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={[]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={c.fg} />}
      >
        {/* HERO */}
        <View className="relative" style={{ height: 520 }}>
          {settings?.hero_image_url ? (
            <Image source={settings.hero_image_url} style={{ width: "100%", height: "100%" }} contentFit="cover" cachePolicy="memory-disk" />
          ) : (
            <View className="h-full w-full bg-surface-sunken" />
          )}
          <View className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.42)" }} />
          <View className="absolute inset-x-0 bottom-0 gap-4 px-5 pb-8">
            <Text className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/85">{settings?.hero_subtitle ?? "Bộ sưu tập mới"}</Text>
            <Text className="text-[33px] font-black uppercase leading-[1.06] text-white">{settings?.hero_title ?? "Phong cách phố.\nDấu ấn riêng."}</Text>
            <View className="mt-1.5 flex-row gap-2.5">
              <Button title={settings?.hero_primary_button_text ?? "Mua hàng mới"} variant="light" icon="arrow-right" onPress={goCatalog} />
              <Button title="Xem bộ sưu tập" variant="outlineLight" onPress={goCatalog} />
            </View>
          </View>
        </View>

        {/* FREE SHIP STRIP */}
        {freeShipThreshold > 0 ? (
          <View className="flex-row items-center justify-center gap-2.5 bg-ink px-4 py-3">
            <Feather name="truck" size={16} color={c.onInk} />
            <Text className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-fg">Miễn phí ship cho đơn từ {formatVnd(freeShipThreshold)}</Text>
          </View>
        ) : null}

        {/* COLLECTIONS */}
        {collections.length > 0 ? (
          <View className="pb-1 pt-7">
            <View className="px-4">
              <SectionHeader eyebrow="Tuyển chọn" title="Bộ sưu tập" />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 px-4">
              {collections.map((cat, i) => {
                const img = products[i % Math.max(1, products.length)]?.image;
                return (
                  <Pressable key={cat.id} onPress={() => goCollection(cat.id)} style={{ width: 230 }} className="active:opacity-80" accessibilityRole="button" accessibilityLabel={`Bộ sưu tập ${cat.name}`}>
                    <View className="relative overflow-hidden bg-img-bg" style={{ height: 300 }}>
                      {img ? <Image source={getResizedImageUrl(img, 500)} style={{ width: "100%", height: "100%" }} contentFit="cover" cachePolicy="memory-disk" /> : null}
                      <View className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.35)" }} />
                      <View className="absolute inset-x-0 bottom-0 p-4">
                        <Text variant="h2" className="text-[22px] text-white">{cat.name}</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* NEW ARRIVALS */}
        <View className="px-4 pb-1 pt-7">
          <SectionHeader eyebrow="Vừa lên kệ" title="Hàng mới về" action="Xem tất cả" onAction={goCatalog} />
          {isLoading ? (
            <View className="flex-row flex-wrap gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <View key={i} className="basis-[47%]">
                  <Skeleton className="w-full" style={{ aspectRatio: 3 / 4 }} />
                  <Skeleton className="mt-2.5 h-3 w-4/5" />
                </View>
              ))}
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between gap-y-4">
              {newest.map((p) => (
                <View key={p.product_id} style={{ width: "48%" }}>
                  <ProductCard product={p} saved={wishlist.has(p.product_id)} onToggleSave={user ? () => wishlist.toggle(p.product_id) : undefined} onPress={() => router.push(`/product/${p.slug}` as any)} />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* PROMO */}
        <View className="mx-4 mt-7 flex-row items-center justify-between gap-3 bg-accent px-5 py-6">
          <View className="gap-1.5">
            <Text className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/80">RESEY10</Text>
            <Text variant="h2" className="text-[19px] leading-[1.15] text-white">Giảm 10%{"\n"}đơn đầu tiên</Text>
          </View>
          <Feather name="tag" size={40} color="#fff" style={{ opacity: 0.9 }} />
        </View>

        {/* BEST SELLERS */}
        {best.length > 0 ? (
          <View className="pb-1 pt-8">
            <View className="px-4">
              <SectionHeader eyebrow="Được yêu thích" title="Bán chạy nhất" action="Xem tất cả" onAction={goCatalog} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 px-4">
              {best.map((p) => (
                <View key={p.product_id} style={{ width: 156 }}>
                  <ProductCard product={p} saved={wishlist.has(p.product_id)} onToggleSave={user ? () => wishlist.toggle(p.product_id) : undefined} onPress={() => router.push(`/product/${p.slug}` as any)} />
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* BRAND STORY */}
        <View className="relative mt-7" style={{ height: 420 }}>
          {settings?.hero_image_url ? (
            <ImageBackground source={{ uri: settings.hero_image_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover">
              <View className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} />
            </ImageBackground>
          ) : (
            <View className="h-full w-full bg-surface-sunken" />
          )}
          <View className="absolute inset-x-0 bottom-0 gap-3.5 px-5 pb-7">
            <Text className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/80">RESEY</Text>
            <Text className="text-[30px] font-black uppercase leading-none text-white">Bản sắc đường phố,{"\n"}tinh thần hiện đại.</Text>
            <Text className="max-w-[300px] text-[13.5px] leading-[1.55] text-white/80">RESEY là streetwear nội địa: form dễ mặc, chất liệu bền, màu sắc cá tính.</Text>
            <View className="mt-1 flex-row">
              <Button title="Câu chuyện RESEY" variant="outlineLight" onPress={goCatalog} />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
