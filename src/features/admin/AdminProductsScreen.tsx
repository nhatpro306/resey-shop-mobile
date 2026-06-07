import React, { useState } from "react";
import { View, FlatList, Pressable, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { useThemeColors } from "@/config/theme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminListProducts, adminToggleProduct } from "@/domain/services/admin/product";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import { Skeleton } from "@/ui/Skeleton";
import { formatVnd } from "@/lib/currency";
import type { AppError } from "@/domain/errors";

export function AdminProductsScreen() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const c = useThemeColors();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-products", page],
    queryFn: () => adminListProducts(page, 30),
    staleTime: 30_000,
  });

  const toggleProduct = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => adminToggleProduct(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
    onError: (e) => Alert.alert("Error", (e as AppError).message),
  });

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="flex-row items-center border-b border-border px-4 pb-3 pt-4">
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-9 w-9 items-center justify-center" accessibilityLabel="Back">
          <Feather name="chevron-left" size={24} color={c.fg} />
        </Pressable>
        <Text variant="h2" className="flex-1 text-center text-base">Products</Text>
        <Button
          title="+ New"
          className="h-9 px-3"
          onPress={() => router.push("/admin/product/new" as any)}
        />
      </View>

      {isLoading ? (
        <View className="px-4 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </View>
      ) : (
        <FlatList
          data={data?.products ?? []}
          keyExtractor={(p) => p.product_id}
          contentContainerClassName="gap-2 px-4 pb-6"
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#FAFAFA" />}
          renderItem={({ item: p }) => (
            <View className="flex-row items-center gap-3 rounded-lg bg-surface p-3">
              <Pressable
                onPress={() => router.push(`/admin/product/${p.product_id}` as any)}
                className="flex-1 flex-row items-center gap-3 active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel={`Edit ${p.title}`}
              >
                <View className="flex-1 gap-0.5">
                  <Text variant="small" className="font-semibold" numberOfLines={1}>{p.title}</Text>
                  <Text variant="caption" className="text-muted">{formatVnd(p.price)} · stock: {p.stock}</Text>
                </View>
                <Badge label={p.is_active ? "Active" : "Inactive"} variant={p.is_active ? "success" : "default"} />
              </Pressable>
              <Button
                title={p.is_active ? "Disable" : "Enable"}
                variant="ghost"
                className="h-8 px-2"
                onPress={() =>
                  Alert.alert(
                    p.is_active ? "Disable product?" : "Enable product?",
                    p.title,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Confirm",
                        onPress: () => toggleProduct.mutate({ id: p.product_id, active: !p.is_active }),
                      },
                    ],
                  )
                }
              />
            </View>
          )}
          ListFooterComponent={
            data && data.total > 30 ? (
              <View className="flex-row justify-center gap-4 pt-2">
                {page > 1 && <Button title="← Prev" variant="ghost" onPress={() => setPage((p) => p - 1)} />}
                {data.products.length === 30 && (
                  <Button title="Next →" variant="ghost" onPress={() => setPage((p) => p + 1)} />
                )}
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
