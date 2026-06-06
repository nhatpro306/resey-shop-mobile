import { ActivityIndicator, Pressable, View, type PressableProps } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Text } from "./Text";
import { cn } from "@/lib/cn";

type Variant = "primary" | "accent" | "outline" | "soft" | "ghost" | "light" | "outlineLight" | "secondary" | "destructive";
type Size = "lg" | "md" | "sm";

const container: Record<Variant, string> = {
  primary: "bg-ink",
  accent: "bg-accent",
  outline: "bg-transparent border border-border-strong",
  soft: "bg-surface-sunken",
  ghost: "bg-transparent",
  light: "bg-white",
  outlineLight: "bg-transparent border border-white/60",
  secondary: "bg-surface-sunken border border-border", // legacy alias
  destructive: "bg-danger",
};
const label: Record<Variant, string> = {
  primary: "text-ink-fg",
  accent: "text-accent-fg",
  outline: "text-fg",
  soft: "text-fg",
  ghost: "text-fg",
  light: "text-ink",
  outlineLight: "text-white",
  secondary: "text-fg",
  destructive: "text-white",
};
const sizeH: Record<Size, string> = { lg: "h-[52px] px-6", md: "h-11 px-5", sm: "h-9 px-4" };

function iconColorFor(variant: Variant) {
  if (variant === "light") return "#09090b";
  if (variant === "outline" || variant === "soft" || variant === "ghost" || variant === "secondary") return "#09090b";
  return "#fff"; // primary/accent/destructive/outlineLight
}

export interface ButtonProps extends Omit<PressableProps, "children"> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  full?: boolean;
  icon?: React.ComponentProps<typeof Feather>["name"];
  className?: string;
}

export function Button({
  title,
  variant = "primary",
  size = "lg",
  loading = false,
  full = false,
  icon,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const spinColor = iconColorFor(variant) === "#fff" ? "#fff" : "#09090b";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      className={cn(
        "flex-row items-center justify-center gap-2",
        sizeH[size],
        container[variant],
        full && "w-full",
        isDisabled && "opacity-40",
        className,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={spinColor} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon ? <Feather name={icon} size={16} color={iconColorFor(variant)} /> : null}
          <Text className={cn("text-xs font-bold uppercase tracking-[0.16em]", label[variant])}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}
