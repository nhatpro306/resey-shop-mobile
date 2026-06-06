import { View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Text } from "./Text";
import { useThemeColors } from "@/config/theme";

export function Stars({ rating, size = 12, showNum, count }: { rating: number; size?: number; showNum?: boolean; count?: number }) {
  const c = useThemeColors();
  const rounded = Math.round(rating);
  return (
    <View className="flex-row items-center gap-1">
      <View className="flex-row gap-[1.5px]">
        {[0, 1, 2, 3, 4].map((i) => (
          <Feather
            key={i}
            name="star"
            size={size}
            color={c.accent}
            // filled vs empty: fill via color, empty via border tone
            style={{ opacity: i < rounded ? 1 : 0.25 }}
          />
        ))}
      </View>
      {showNum ? (
        <Text variant="caption" className="font-semibold text-fg-muted">
          {rating}{count != null ? ` (${count})` : ""}
        </Text>
      ) : null}
    </View>
  );
}
