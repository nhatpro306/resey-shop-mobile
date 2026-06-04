import { type ComponentProps } from "react";
import { type ColorValue } from "react-native";
import { Tabs } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { tokens } from "@/config/theme";

type FeatherName = ComponentProps<typeof Feather>["name"];

function tabIcon(name: FeatherName) {
  const Icon = ({ color, size }: { color: ColorValue; size: number }) => (
    <Feather name={name} color={color as string} size={size} />
  );
  Icon.displayName = `TabIcon(${name})`;
  return Icon;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.color.primary,
        tabBarInactiveTintColor: tokens.color.muted,
        tabBarStyle: {
          backgroundColor: tokens.color.surface,
          borderTopColor: tokens.color.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: tabIcon("home") }} />
      <Tabs.Screen name="catalog" options={{ title: "Catalog", tabBarIcon: tabIcon("grid") }} />
      <Tabs.Screen name="cart" options={{ title: "Cart", tabBarIcon: tabIcon("shopping-bag") }} />
      <Tabs.Screen name="orders" options={{ title: "Orders", tabBarIcon: tabIcon("package") }} />
      <Tabs.Screen name="account" options={{ title: "Account", tabBarIcon: tabIcon("user") }} />
    </Tabs>
  );
}
