import { Pressable, View } from "react-native";
import { cn } from "@/lib/cn";

// Approx hex for common RESEY washed-tone color names (vi + en). Fallback grey.
const SWATCH_HEX: Record<string, string> = {
  "Nâu": "#7c6a5b", "Nâu khói": "#5f5246", "Rêu": "#6f7256", "Đen": "#1b1b1d", "Kem": "#d8cfbf",
  Brown: "#7c6a5b", Olive: "#6f7256", Black: "#1b1b1d", Cream: "#d8cfbf", "Smoke Brown": "#5f5246",
  White: "#f5f5f5", Grey: "#9a9a9e", Gray: "#9a9a9e", Navy: "#2a3243", Beige: "#d8cfbf",
};

export function swatchHex(name: string): string {
  return SWATCH_HEX[name] ?? "#9a9a9e";
}

export function Swatch({ name, active, onPress }: { name: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={name}
      className={cn("h-[34px] w-[34px] items-center justify-center rounded-full p-[3px]", active ? "border-[1.5px] border-border-strong" : "border-[1.5px] border-transparent")}
    >
      <View className="h-full w-full rounded-full" style={{ backgroundColor: swatchHex(name), borderWidth: 1, borderColor: "rgba(0,0,0,0.12)" }} />
    </Pressable>
  );
}
