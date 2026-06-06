import React from "react";
import { View, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Image } from "expo-image";
import Feather from "@expo/vector-icons/Feather";
import { useProfile } from "./hooks";
import { useAuth } from "@/features/auth/AuthContext";
import { useTheme } from "@/features/theme/ThemeProvider";
import { authService } from "@/domain/services/auth";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { EmptyState } from "@/ui/EmptyState";
import { useThemeColors } from "@/config/theme";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

export function AccountScreen() {
  const { user, isAdmin } = useAuth();
  const { data: profile } = useProfile(user?.id ?? null);
  const { mode, toggle } = useTheme();
  const c = useThemeColors();

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
        <EmptyState title="Đăng nhập vào tài khoản" actionLabel="Đăng nhập" onAction={() => router.push("/(auth)/login")} />
      </SafeAreaView>
    );
  }

  async function handleSignOut() {
    Alert.alert("Đăng xuất", "Bạn chắc chắn?", [
      { text: "Huỷ", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: async () => { await authService.signOut(); router.replace("/(auth)/login"); } },
    ]);
  }

  const menu: { label: string; icon: FeatherName; onPress: () => void }[] = [
    { label: "Đơn hàng của tôi", icon: "package", onPress: () => router.push("/(tabs)/orders") },
    { label: "Sổ địa chỉ", icon: "map-pin", onPress: () => router.push("/addresses" as any) },
    ...(isAdmin ? [{ label: "Quản trị", icon: "shield" as FeatherName, onPress: () => router.push("/(admin)" as any) }] : []),
  ];

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-6 px-4 pb-10 pt-4">
        <Text variant="eyebrow">Tài khoản</Text>

        {/* Profile header */}
        <View className="flex-row items-center gap-4">
          {profile?.avatar_url ? (
            <Image source={profile.avatar_url} style={{ width: 64, height: 64, borderRadius: 32 }} contentFit="cover" cachePolicy="memory-disk" />
          ) : (
            <View className="h-16 w-16 items-center justify-center rounded-full bg-surface-sunken">
              <Text variant="h2" className="text-xl">{(profile?.username ?? user.email ?? "?")[0]?.toUpperCase()}</Text>
            </View>
          )}
          <View className="flex-1 gap-0.5">
            <Text className="text-base font-bold text-fg">{profile?.username ?? "Thành viên"}</Text>
            <Text className="text-sm text-fg-subtle">{user.email}</Text>
            {isAdmin ? <Text className="text-[11px] font-bold uppercase tracking-[0.1em] text-accent">Quản trị viên</Text> : null}
          </View>
          <Button title="Sửa" variant="soft" size="sm" onPress={() => router.push("/edit-profile" as any)} />
        </View>

        {/* Menu */}
        <View className="overflow-hidden border border-border">
          {menu.map((s, i) => (
            <Pressable
              key={s.label}
              onPress={s.onPress}
              className={`flex-row items-center gap-3 px-4 py-4 active:opacity-70 ${i < menu.length - 1 ? "border-b border-border" : ""}`}
              accessibilityRole="menuitem"
            >
              <Feather name={s.icon} size={18} color={c.fgSubtle} />
              <Text className="flex-1 text-sm text-fg">{s.label}</Text>
              <Feather name="chevron-right" size={18} color={c.fgSubtle} />
            </Pressable>
          ))}
        </View>

        {/* Appearance */}
        <View className="border border-border">
          <Pressable onPress={toggle} className="flex-row items-center gap-3 px-4 py-4 active:opacity-70" accessibilityRole="switch" accessibilityState={{ checked: mode === "dark" }}>
            <Feather name={mode === "dark" ? "moon" : "sun"} size={18} color={c.fgSubtle} />
            <Text className="flex-1 text-sm text-fg">Giao diện tối</Text>
            <View className={`h-6 w-11 justify-center rounded-full px-0.5 ${mode === "dark" ? "bg-accent" : "bg-border"}`}>
              <View className={`h-5 w-5 rounded-full bg-white ${mode === "dark" ? "self-end" : "self-start"}`} />
            </View>
          </Pressable>
        </View>

        <Button title="Đăng xuất" variant="outline" full icon="log-out" onPress={handleSignOut} />
      </ScrollView>
    </SafeAreaView>
  );
}
