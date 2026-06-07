import React, { useState } from "react";
import { View, FlatList, RefreshControl, Alert, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAdminUsers, useToggleUserActive, useSetUserRole } from "./hooks";
import { useAuth } from "@/features/auth/AuthContext";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import { Skeleton } from "@/ui/Skeleton";
import { EmptyState } from "@/ui/EmptyState";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { useThemeColors } from "@/config/theme";
import type { AppError } from "@/domain/errors";

export function AdminUsersScreen() {
  const { isAdmin, user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useAdminUsers(page);
  const toggleActive = useToggleUserActive();
  const setRole = useSetUserRole();
  const c = useThemeColors();

  if (!isAdmin) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <EmptyState title="Access denied" subtitle="Admin only." actionLabel="Back" onAction={() => router.back()} />
      </SafeAreaView>
    );
  }

  function onError(e: unknown) {
    Alert.alert("Error", (e as AppError).message);
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="flex-row items-center border-b border-border px-4 pb-3 pt-4">
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-9 w-9 items-center justify-center" accessibilityLabel="Back">
          <Feather name="chevron-left" size={24} color={c.fg} />
        </Pressable>
        <Text variant="h2" className="flex-1 text-center text-base">Users</Text>
        <View className="w-9" />
      </View>

      {isLoading ? (
        <View className="px-4 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </View>
      ) : (
        <FlatList
          data={data?.users ?? []}
          keyExtractor={(u) => u.profile_id}
          contentContainerClassName="gap-2 px-4 pb-6"
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#FAFAFA" />}
          renderItem={({ item: u }) => {
            const isSelf = u.profile_id === currentUser?.id;
            return (
              <View className="rounded-lg bg-surface p-3 gap-2">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text variant="small" className="font-semibold" numberOfLines={1}>
                      {u.username ?? "—"} {isSelf && <Text variant="caption" className="text-muted">(you)</Text>}
                    </Text>
                    <Text variant="caption" className="text-muted" numberOfLines={1}>{u.email}</Text>
                  </View>
                  <View className="flex-row gap-1">
                    <Badge label={u.role} variant={u.role === "admin" ? "info" : "default"} />
                    <Badge label={u.is_active ? "Active" : "Disabled"} variant={u.is_active ? "success" : "danger"} />
                  </View>
                </View>
                {!isSelf && (
                  <View className="flex-row gap-2">
                    <Button
                      title={u.is_active ? "Disable" : "Enable"}
                      variant="secondary"
                      className="h-8 px-3"
                      onPress={() =>
                        toggleActive.mutate({ userId: u.profile_id, active: !u.is_active }, { onError })
                      }
                    />
                    <Button
                      title={u.role === "admin" ? "Make user" : "Make admin"}
                      variant="ghost"
                      className="h-8 px-3"
                      onPress={() =>
                        Alert.alert(
                          "Change role?",
                          `${u.username ?? u.email} → ${u.role === "admin" ? "user" : "admin"}`,
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Confirm",
                              onPress: () =>
                                setRole.mutate(
                                  { userId: u.profile_id, role: u.role === "admin" ? "user" : "admin" },
                                  { onError },
                                ),
                            },
                          ],
                        )
                      }
                    />
                  </View>
                )}
              </View>
            );
          }}
          ListFooterComponent={
            data && data.total > 30 ? (
              <View className="flex-row justify-center gap-4 pt-2">
                {page > 1 && <Button title="← Prev" variant="ghost" onPress={() => setPage((p) => p - 1)} />}
                {data.users.length === 30 && <Button title="Next →" variant="ghost" onPress={() => setPage((p) => p + 1)} />}
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
