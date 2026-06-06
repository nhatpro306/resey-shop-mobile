import React, { useState, useCallback } from "react";
import { View, TextInput, Pressable, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import Feather from "@expo/vector-icons/Feather";
import { useProducts, useCategories } from "./hooks";
import { useAuth } from "@/features/auth/AuthContext";
import { useWishlist } from "@/features/saved/hooks";
import { ProductCard } from "@/ui/ProductCard";
import { Skeleton } from "@/ui/Skeleton";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { Sheet } from "@/ui/Sheet";
import { useThemeColors } from "@/config/theme";
import { cn } from "@/lib/cn";
import type { ProductFilters, ProductType } from "@/domain/types";

const SORTS: { key: NonNullable<ProductFilters["sort"]>; label: string }[] = [
  { key: "newest", label: "Mới nhất" },
  { key: "price_asc", label: "Giá thấp → cao" },
  { key: "price_desc", label: "Giá cao → thấp" },
];

function Chip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={cn("h-8 items-center justify-center border px-3.5", active ? "border-ink bg-ink" : "border-border bg-surface")}
      accessibilityRole="button"
    >
      <Text className={cn("text-[11px] font-bold uppercase tracking-[0.1em]", active ? "text-ink-fg" : "text-fg-muted")}>
        {label}
      </Text>
    </Pressable>
  );
}

export function CatalogScreen() {
  const c = useThemeColors();
  const { user } = useAuth();
  const wishlist = useWishlist(user?.id ?? null);
  const [filters, setFilters] = useState<ProductFilters>({});
  const [search, setSearch] = useState("");
  const [sheet, setSheet] = useState(false);

  const activeFilters: ProductFilters = { ...filters, search: search.length >= 2 ? search : undefined };
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } = useProducts(activeFilters);
  const { data: categories } = useCategories();
  const allProducts: ProductType[] = data?.pages.flatMap((p) => p.items) ?? [];

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isError) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-bg px-8" edges={["top"]}>
        <Feather name="wifi-off" size={36} color={c.fgFaint} />
        <Text variant="h2" className="text-center text-lg">Không tải được sản phẩm</Text>
        <Button title="Thử lại" variant="outline" size="md" onPress={() => refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      {/* Header */}
      <View className="border-b border-border">
        <View className="flex-row items-end justify-between px-4 pt-2">
          <View className="gap-2">
            <Text variant="eyebrow">Cửa hàng</Text>
            <Text variant="h1" className="text-[27px]">Sản phẩm</Text>
          </View>
          <Text className="pb-1 text-xs font-semibold text-fg-subtle">{allProducts.length} sản phẩm</Text>
        </View>

        {/* search + filter */}
        <View className="flex-row gap-2.5 px-4 pb-3 pt-3.5">
          <View className="h-11 flex-1 flex-row items-center gap-2.5 border border-border bg-surface px-3">
            <Feather name="search" size={17} color={c.fgSubtle} />
            <TextInput
              className="flex-1 text-sm text-fg"
              placeholder="Tìm sản phẩm..."
              placeholderTextColor={c.fgSubtle}
              value={search}
              onChangeText={setSearch}
              accessibilityLabel="Tìm sản phẩm"
            />
            {search.length > 0 ? (
              <Pressable onPress={() => setSearch("")} hitSlop={8} accessibilityLabel="Xoá">
                <Feather name="x" size={16} color={c.fgSubtle} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={() => setSheet(true)}
            className="h-11 w-11 items-center justify-center border border-border-strong bg-surface"
            accessibilityRole="button"
            accessibilityLabel="Bộ lọc"
          >
            <Feather name="sliders" size={18} color={c.fg} />
          </Pressable>
        </View>

        {/* category chips */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: null, name: "Tất cả" }, ...(categories ?? [])] as { id: number | null; name: string }[]}
          keyExtractor={(item) => String(item.id ?? "all")}
          contentContainerClassName="gap-2 px-4 pb-3"
          renderItem={({ item }) => (
            <Chip
              active={filters.categoryId === (item.id ?? undefined)}
              label={item.name}
              onPress={() => setFilters((f) => ({ ...f, categoryId: item.id ?? undefined }))}
            />
          )}
        />
      </View>

      {/* grid */}
      {isLoading ? (
        <View className="flex-row flex-wrap gap-3 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} className="basis-[47%]">
              <Skeleton className="w-full" style={{ aspectRatio: 3 / 4 }} />
              <Skeleton className="mt-2.5 h-3 w-4/5" />
              <Skeleton className="mt-1.5 h-3 w-1/2" />
            </View>
          ))}
        </View>
      ) : allProducts.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3.5 px-8">
          <Feather name="search" size={40} color={c.fgFaint} />
          <Text variant="h2" className="text-center text-lg">Không tìm thấy sản phẩm</Text>
          <Button title="Xoá bộ lọc" variant="outline" size="md" onPress={() => { setFilters({}); setSearch(""); }} />
        </View>
      ) : (
        <FlashList
          data={allProducts}
          numColumns={2}
          keyExtractor={(p) => p.product_id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 }}
          renderItem={({ item }) => (
            <View className="flex-1 px-1.5 pb-4">
              <ProductCard
                product={item}
                saved={wishlist.has(item.product_id)}
                onToggleSave={user ? () => wishlist.toggle(item.product_id) : undefined}
                onPress={() => router.push(`/product/${item.slug}` as any)}
              />
            </View>
          )}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isFetchingNextPage ? <Skeleton className="mx-4 mb-4 h-8" /> : null}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={c.fg} />}
        />
      )}

      {/* filter sheet */}
      <Sheet open={sheet} onClose={() => setSheet(false)} title="Bộ lọc">
        <View className="gap-6">
          <View>
            <Text variant="eyebrow">Sắp xếp</Text>
            <View className="mt-3 border border-border">
              {SORTS.map((s, i) => {
                const on = (filters.sort ?? "newest") === s.key;
                return (
                  <Pressable
                    key={s.key}
                    onPress={() => setFilters((f) => ({ ...f, sort: s.key }))}
                    className={cn("flex-row items-center justify-between px-3.5 py-3.5", i ? "border-t border-border" : "")}
                    accessibilityRole="button"
                  >
                    <Text className={cn("text-sm", on ? "font-bold text-fg" : "text-fg-muted")}>{s.label}</Text>
                    {on ? <Feather name="check" size={18} color={c.accent} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View>
            <Text variant="eyebrow">Danh mục</Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {[{ id: null, name: "Tất cả" }, ...(categories ?? [])].map((item) => (
                <Chip
                  key={String(item.id ?? "all")}
                  active={filters.categoryId === (item.id ?? undefined)}
                  label={item.name}
                  onPress={() => setFilters((f) => ({ ...f, categoryId: item.id ?? undefined }))}
                />
              ))}
            </View>
          </View>

          <View className="flex-row gap-2.5 pt-1">
            <View className="flex-1">
              <Button title="Đặt lại" variant="soft" full onPress={() => { setFilters({}); }} />
            </View>
            <View className="flex-1">
              <Button title="Áp dụng" variant="primary" full onPress={() => setSheet(false)} />
            </View>
          </View>
        </View>
      </Sheet>
    </SafeAreaView>
  );
}
