import { View } from "react-native";
import { Text } from "./Text";
import { cn } from "@/lib/cn";
import { formatVnd } from "@/lib/currency";

export function Price({
  price,
  sale,
  size = "sm",
  accent = true,
}: {
  price: number;
  sale?: number | null;
  size?: "sm" | "md" | "lg";
  accent?: boolean;
}) {
  const onSale = sale != null && sale < price;
  const main = onSale ? sale! : price;
  const cls = size === "lg" ? "text-xl" : size === "md" ? "text-base" : "text-[13px]";
  return (
    <View className="flex-row items-baseline gap-2">
      <Text style={{ fontVariant: ["tabular-nums"] }} className={cn(cls, "font-bold", accent && onSale ? "text-accent" : "text-fg")}>{formatVnd(main)}</Text>
      {onSale ? (
        <Text style={{ fontVariant: ["tabular-nums"] }} className="text-xs text-fg-faint line-through">{formatVnd(price)}</Text>
      ) : null}
    </View>
  );
}
