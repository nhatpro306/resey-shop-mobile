import { useState } from "react";
import { View, Pressable } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Text } from "./Text";
import { useThemeColors } from "@/config/theme";

export function Accordion({
  title,
  children,
  defaultOpen,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const c = useThemeColors();
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <View className="border-t border-border">
      <Pressable
        onPress={() => setOpen((o) => !o)}
        className="flex-row items-center justify-between py-[18px]"
        accessibilityRole="button"
      >
        <Text variant="cardtitle" className="text-[13px]">{title}</Text>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={18} color={c.fgSubtle} />
      </Pressable>
      {open ? <View className="pb-[18px]">{children}</View> : null}
    </View>
  );
}
