import React from "react";
import { View, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Image } from "expo-image";
import Feather from "@expo/vector-icons/Feather";
import { useProfile } from "./hooks";
import { useAuth } from "@/features/auth/AuthContext";
import { authService } from "@/domain/services/auth";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { EmptyState } from "@/ui/EmptyState";
import { tokens } from "@/config/theme";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

export function AccountScreen() {
  const { user, isAdmin } = useAuth();
  const { data: profile } = useProfile(user?.id ?? null);

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <EmptyState
          title="Sign in to your account"
          actionLabel="Sign in"
          onAction={() => router.push("/(auth)/login")}
        />
      </SafeAreaView>
    );
  }

  async function handleSignOut() {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await authService.signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  const sections: { label: string; icon: FeatherName; onPress: () => void }[] = [
    { label: "My orders", icon: "package", onPress: () => router.push("/(tabs)/orders") },
    { label: "My addresses", icon: "map-pin", onPress: () => router.push("/addresses" as any) },
    ...(isAdmin
      ? [{ label: "Admin dashboard", icon: "shield" as FeatherName, onPress: () => router.push("/(admin)" as any) }]
      : []),
  ];

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-5 px-4 pt-4 pb-8">
        <Text variant="overline" className="text-muted">Account</Text>

        {/* Profile header */}
        <View className="flex-row items-center gap-4">
          {profile?.avatar_url ? (
            <Image
              source={profile.avatar_url}
              style={{ width: 64, height: 64, borderRadius: 32 }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View className="h-16 w-16 items-center justify-center rounded-full bg-surface">
              <Text variant="h2">{(profile?.username ?? user.email ?? "?")[0]?.toUpperCase()}</Text>
            </View>
          )}
          <View className="flex-1 gap-0.5">
            <Text variant="body" className="font-semibold">
              {profile?.username ?? "User"}
            </Text>
            <Text variant="small" className="text-muted">{user.email}</Text>
            {isAdmin && (
              <Text variant="caption" className="text-primary font-semibold">Admin</Text>
            )}
          </View>
          <Button
            title="Edit"
            variant="secondary"
            className="h-8 px-3"
            onPress={() => router.push("/edit-profile" as any)}
          />
        </View>

        {/* Menu */}
        <View className="overflow-hidden bg-surface">
          {sections.map((s, i) => (
            <Pressable
              key={s.label}
              onPress={s.onPress}
              className={`flex-row items-center gap-3 px-4 py-4 active:opacity-70 ${
                i < sections.length - 1 ? "border-b border-border" : ""
              }`}
              accessibilityRole="menuitem"
            >
              <Feather name={s.icon} size={18} color={tokens.color.muted} />
              <Text variant="small" className="flex-1">{s.label}</Text>
              <Feather name="chevron-right" size={18} color={tokens.color.muted} />
            </Pressable>
          ))}
        </View>

        <Button title="Sign out" variant="destructive" onPress={handleSignOut} />
      </ScrollView>
    </SafeAreaView>
  );
}
