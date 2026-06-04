import { View } from "react-native";
import { Text } from "./Text";
import { cn } from "@/lib/cn";

// RESEY wordmark: maroon "R" block + wordmark. Placeholder until the logo
// asset is wired into assets/ — swap for <Image source={logo}/> when available.
export function BrandMark({ className }: { className?: string }) {
  return (
    <View className={cn("flex-row items-center gap-3", className)}>
      <View className="h-12 w-12 items-center justify-center bg-primary">
        <Text className="text-2xl font-black text-primary-fg">R</Text>
      </View>
      <Text variant="display" className="text-3xl">RESEY</Text>
    </View>
  );
}
