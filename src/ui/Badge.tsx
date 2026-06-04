import { View } from "react-native";
import { Text } from "./Text";
import { cn } from "@/lib/cn";

type Variant = "default" | "success" | "warning" | "danger" | "info";

const bg: Record<Variant, string> = {
  default: "bg-surface",
  success: "bg-success/20",
  warning: "bg-warning/20",
  danger: "bg-danger/20",
  info: "bg-info/20",
};
const textColor: Record<Variant, string> = {
  default: "text-muted",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
};

export function Badge({ label, variant = "default" }: { label: string; variant?: Variant }) {
  return (
    <View className={cn("rounded-pill px-2 py-0.5", bg[variant])}>
      <Text variant="caption" className={cn("font-semibold", textColor[variant])}>
        {label}
      </Text>
    </View>
  );
}

export function orderStatusVariant(status: string): Variant {
  switch (status) {
    case "delivered":
    case "completed": return "success";
    case "shipping":
    case "shipped": return "info";
    case "confirmed":
    case "processing": return "warning";
    case "cancelled": return "danger";
    default: return "default";
  }
}
