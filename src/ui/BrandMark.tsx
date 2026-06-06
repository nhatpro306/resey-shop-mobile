import { View } from "react-native";
import { Image } from "expo-image";
import { Text } from "./Text";
import { cn } from "@/lib/cn";

// Real RESEY logo (from the design BIMI vector, rasterized to assets/resey-logo.png).
export function BrandMark({ className }: { className?: string }) {
  return (
    <View className={cn("flex-row items-center gap-3", className)}>
      <Image
        source={require("../../assets/resey-logo.png")}
        style={{ width: 44, height: 44 }}
        contentFit="contain"
      />
      <Text variant="display" className="text-3xl">RESEY</Text>
    </View>
  );
}
