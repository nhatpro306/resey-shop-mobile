import { View, Pressable } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Text } from "./Text";
import { useThemeColors } from "@/config/theme";

export function SectionHeader({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow?: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const c = useThemeColors();
  return (
    <View className="mb-3.5 flex-row items-end justify-between">
      <View className="gap-1.5">
        {eyebrow ? <Text variant="eyebrow">{eyebrow}</Text> : null}
        <Text variant="h2" className="text-[22px]">{title}</Text>
      </View>
      {action && onAction ? (
        <Pressable onPress={onAction} className="flex-row items-center gap-1 pb-0.5" accessibilityRole="button">
          <Text className="text-[11px] font-bold uppercase tracking-[0.12em] text-fg">{action}</Text>
          <Feather name="arrow-right" size={13} color={c.fg} />
        </Pressable>
      ) : null}
    </View>
  );
}
