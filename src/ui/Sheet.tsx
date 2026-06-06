import React from "react";
import { Modal, View, Pressable, ScrollView } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Text } from "./Text";
import { useThemeColors } from "@/config/theme";

export function Sheet({
  open,
  onClose,
  title,
  children,
  maxHeightPct = 0.86,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxHeightPct?: number;
}) {
  const c = useThemeColors();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/45" onPress={onClose} accessibilityLabel="Close" />
        <View className="border-t border-border bg-surface" style={{ maxHeight: `${maxHeightPct * 100}%` }}>
          <View className="flex-row items-center justify-between border-b border-border px-4 pb-3 pt-4">
            <Text variant="h2" className="text-[17px]">{title}</Text>
            <Pressable onPress={onClose} hitSlop={8} className="h-8 w-8 items-center justify-center" accessibilityLabel="Close">
              <Feather name="x" size={20} color={c.fg} />
            </Pressable>
          </View>
          <ScrollView contentContainerClassName="p-4" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
