import React, { useState, useCallback } from "react";
import { View, TextInput, Pressable, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import Feather from "@expo/vector-icons/Feather";
import { useProducts, useCategories } from "./hooks";
import { ProductCard } from "@/ui/ProductCard";
import { Skeleton } from "@/ui/Skeleton";
import { EmptyState } from "@/ui/EmptyState";
import { Text } from "@/ui/Text";
import { tokens } from "@/config/theme";
import { cn } from "@/lib/cn";
import type { ProductFilters, ProductType } from "@/domain/types";

function Chip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "border px-3 py-1.5",
        active ? "border-primary bg-primary" : "border-border bg-surface",
      )}
      accessibilityRole="button"
    >
      <Text variant="caption" className={cn("font-semibold", active ? "text-primary-fg" : "text-muted")}>
        {label}
      </Text>
    </Pressable>
  );
}

const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "price_asc", label: "Price ↑" },
  { key: "price_desc", label: "Price ↓" },
] as const;

export function CatalogScreen() {
  const [filters, setFilters] = useState<ProductFilters>({});
  const [search, setSearch] = useState("");

  const activeFilters: ProductFilters = { ...filters, search: search.length >= 2 ? search : undefined };
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    useProducts(activeFilters);

  const { data: categories } = useCategories();

  const allProducts: ProductType[] = data?.pages.flatMap((p) => p.items) ?? [];

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <EmptyState
          title="Couldn't load products"
          subtitle="Check your connection and try again."
          actionLabel="Retry"
          onAction={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      {/* Header */}
      <View className="px-4 pt-4">
        <Text variant="overline" className="text-muted">Shop</Text>
        <Text variant="h1">All products</Text>
      </View>

      {/* Search */}
      <View className="px-4 pb-2 pt-3">
        <View className="h-11 flex-row items-center gap-2 border border-border bg-surface px-3">
          <Feather name="search" size={16} color={tokens.color.muted} />
          <TextInput
            className="flex-1 text-sm text-text"
            placeholder="Search products..."
            placeholderTextColor={tokens.color.muted}
            value={search}
            onChangeText={setSearch}
            accessibilityLabel="Search products"
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch("")} hitSlop={8} accessibilityLabel="Clear search">
              <Feather name="x" size={16} color={tokens.color.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Category chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ id: null, name: "All" }, ...(categories ?? [])] as any[]}
        keyExtractor={(item) => String(item.id ?? "all")}
        contentContainerClassName="gap-2 px-4 pb-2"
        renderItem={({ item }) => (
          <Chip
            active={filters.categoryId === (item.id ?? undefined)}
            label={item.name}
            onPress={() => setFilters((f) => ({ ...f, categoryId: item.id ?? undefined }))}
          />
        )}
      />

      {/* Sort chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={SORTS}
        keyExtractor={(s) => s.key}
        contentContainerClassName="gap-2 px-4 pb-3"
        renderItem={({ item }) => (
          <Chip
            active={filters.sort === item.key}
            label={item.label}
            onPress={() => setFilters((f) => ({ ...f, sort: item.key as ProductFilters["sort"] }))}
          />
        )}
      />

      {/* Product grid */}
      {isLoading ? (
        <View className="flex-1 flex-row flex-wrap gap-3 px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="flex-1 basis-5/12 rounded-lg" style={{ aspectRatio: 0.75 }} />
          ))}
        </View>
      ) : allProducts.length === 0 ? (
        <EmptyState
          title="No products found"
          subtitle="Try adjusting your filters."
          actionLabel="Clear filters"
          onAction={() => { setFilters({}); setSearch(""); }}
        />
      ) : (
        <FlashList
          data={allProducts}
          numColumns={2}
          keyExtractor={(p) => p.product_id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          renderItem={({ item }) => (
            <View className="flex-1 px-1">
              <ProductCard
                product={item}
                onPress={() => router.push(`/product/${item.slug}` as any)}
              />
            </View>
          )}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isFetchingNextPage ? <Skeleton className="mx-4 mb-4 h-8 rounded" /> : null}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#FAFAFA" />}
        />
      )}
    </SafeAreaView>
  );
}
