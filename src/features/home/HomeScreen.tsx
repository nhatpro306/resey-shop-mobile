import React from "react";
import { ScrollView, View, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { getStoreSettings } from "@/domain/services/settings";
import { qk } from "@/domain/services/keys";
import { useProducts } from "@/features/catalog/hooks";
import { ProductCard } from "@/ui/ProductCard";
import { Skeleton } from "@/ui/Skeleton";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import type { ProductType } from "@/domain/types";

export function HomeScreen() {
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: qk.storeSettings(),
    queryFn: getStoreSettings,
    staleTime: 5 * 60_000,
  });

  const { data, isLoading: productsLoading, refetch } = useProducts({ sort: "newest" });
  const newest: ProductType[] = data?.pages[0]?.items.slice(0, 6) ?? [];

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#FAFAFA" />}
      >
        {/* Hero */}
        {settingsLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : settings?.hero_image ? (
          <Pressable onPress={() => router.push("/(tabs)/catalog")} accessibilityRole="button">
            <Image
              source={settings.hero_image}
              style={{ width: "100%", height: 260 }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            <View className="absolute inset-0 justify-end bg-black/40 p-5">
              {settings.hero_title && (
                <Text variant="h1" className="text-white">{settings.hero_title}</Text>
              )}
              {settings.hero_subtitle && (
                <Text variant="small" className="text-white/80">{settings.hero_subtitle}</Text>
              )}
              {settings.hero_cta_text && (
                <View className="mt-3 self-start">
                  <Button
                    title={settings.hero_cta_text}
                    onPress={() => router.push("/(tabs)/catalog")}
                    className="px-6"
                  />
                </View>
              )}
            </View>
          </Pressable>
        ) : (
          <View className="h-48 items-center justify-center bg-surface">
            <Text variant="h1">{settings?.store_name ?? "RESEY"}</Text>
            <Text variant="small" className="text-muted">{settings?.store_description ?? "Vietnamese streetwear"}</Text>
          </View>
        )}

        {/* New arrivals */}
        <View className="px-4 pb-6 pt-5">
          <View className="mb-3 flex-row items-center justify-between">
            <Text variant="h2">New arrivals</Text>
            <Pressable onPress={() => router.push("/(tabs)/catalog")} accessibilityRole="link">
              <Text variant="small" className="text-primary">See all</Text>
            </Pressable>
          </View>

          {productsLoading ? (
            <View className="flex-row flex-wrap gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="flex-1 basis-5/12 rounded-lg" style={{ aspectRatio: 0.75 }} />
              ))}
            </View>
          ) : newest.length === 0 ? (
            <Text variant="small" className="text-muted">No products yet. Check back soon.</Text>
          ) : (
            <View className="flex-row flex-wrap gap-3">
              {newest.map((p) => (
                <View key={p.product_id} className="flex-1 basis-5/12">
                  <ProductCard product={p} onPress={() => router.push(`/product/${p.slug}` as any)} />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
