import React from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAddresses } from "./hooks";
import { useAuth } from "@/features/auth/AuthContext";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { EmptyState } from "@/ui/EmptyState";
import { Skeleton } from "@/ui/Skeleton";

export function AddressesScreen() {
  const { user } = useAuth();
  const { data: addresses, isLoading } = useAddresses(user?.id ?? null);

  const address = addresses?.[0] ?? null;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg px-4 pt-6 gap-3">
        <Skeleton className="h-24" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <ScrollView contentContainerClassName="px-4 pt-4 pb-6 gap-5">
        <Text variant="h2">Địa chỉ giao hàng</Text>

        {!address ? (
          <EmptyState
            title="Chưa có địa chỉ"
            subtitle="Thêm địa chỉ giao hàng để đặt hàng nhanh hơn."
            actionLabel="Thêm địa chỉ"
            onAction={() => router.push("/add-address" as any)}
          />
        ) : (
          <View className="gap-4">
            <View className="bg-surface p-4 gap-1.5">
              <Text className="text-sm font-semibold text-fg">{address.street}</Text>
              <Text className="text-sm text-fg-muted">
                {[address.city, address.state, address.zip_code, address.country].filter(Boolean).join(", ")}
              </Text>
            </View>
            <Button
              title="Chỉnh sửa địa chỉ"
              variant="outline"
              full
              icon="edit-2"
              onPress={() => router.push(`/edit-address/${address.id}` as any)}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
