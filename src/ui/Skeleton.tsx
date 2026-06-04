import { View, type ViewStyle } from "react-native";
import { cn } from "@/lib/cn";

export function Skeleton({ className, style }: { className?: string; style?: ViewStyle }) {
  return <View className={cn("rounded-md bg-surface opacity-50", className)} style={style} />;
}
