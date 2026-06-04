import React from "react";
import { View, FlatList, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAddresses, useDeleteAddress, useSetDefaultAddress } from "./hooks";
import { useAuth } from "@/features/auth/AuthContext";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import { EmptyState } from "@/ui/EmptyState";
import { Skeleton } from "@/ui/Skeleton";

export function AddressesScreen() {
  const { user } = useAuth();
  const { data: addresses, isLoading } = useAddresses(user?.id ?? null);
  const deleteAddr = useDeleteAddress(user?.id ?? "");
  const setDefault = useSetDefaultAddress(user?.id ?? "");

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg px-4 pt-6 gap-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <Text variant="h2">Addresses</Text>
        <Button title="+ Add" className="h-9 px-4" onPress={() => router.push("/add-address" as any)} />
      </View>

      <FlatList
        data={addresses ?? []}
        keyExtractor={(a) => String(a.id)}
        contentContainerClassName="gap-3 px-4 pt-2 pb-6"
        ListEmptyComponent={
          <EmptyState
            title="No addresses yet"
            subtitle="Add a shipping address to check out faster."
            actionLabel="Add address"
            onAction={() => router.push("/add-address" as any)}
          />
        }
        renderItem={({ item: a }) => (
          <View className="rounded-lg bg-surface p-4 gap-2">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 gap-0.5">
                <Text variant="small" className="font-semibold">{a.street}</Text>
                <Text variant="caption" className="text-muted">
                  {[a.city, a.state, a.zip_code, a.country].filter(Boolean).join(", ")}
                </Text>
              </View>
              {a.is_default && <Badge label="Default" variant="success" />}
            </View>
            <View className="flex-row gap-2">
              {!a.is_default && (
                <Button
                  title="Set default"
                  variant="secondary"
                  className="h-8 px-3"
                  onPress={() => setDefault.mutate(a.id)}
                />
              )}
              <Button
                title="Edit"
                variant="ghost"
                className="h-8 px-3"
                onPress={() => router.push(`/edit-address/${a.id}` as any)}
              />
              <Button
                title="Delete"
                variant="ghost"
                className="h-8 px-3"
                onPress={() =>
                  Alert.alert("Delete address?", "", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => deleteAddr.mutate(a.id) },
                  ])
                }
              />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
