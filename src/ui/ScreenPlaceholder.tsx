import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "./Text";

// Temporary scaffold screen. Replaced by real feature screens in M3+.
export function ScreenPlaceholder({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 items-center justify-center gap-2 px-6">
        <Text variant="h1">{title}</Text>
        {subtitle ? <Text variant="small">{subtitle}</Text> : null}
      </View>
    </SafeAreaView>
  );
}
