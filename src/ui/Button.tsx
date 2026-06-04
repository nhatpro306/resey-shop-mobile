import { ActivityIndicator, Pressable, type PressableProps } from "react-native";
import { Text } from "./Text";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "destructive";

const container: Record<Variant, string> = {
  primary: "bg-primary",
  secondary: "bg-surface border border-border",
  ghost: "bg-transparent",
  destructive: "bg-danger",
};

const label: Record<Variant, string> = {
  primary: "text-primary-fg",
  secondary: "text-text",
  ghost: "text-text",
  destructive: "text-white",
};

export interface ButtonProps extends Omit<PressableProps, "children"> {
  title: string;
  variant?: Variant;
  loading?: boolean;
  className?: string;
}

export function Button({
  title,
  variant = "primary",
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      className={cn(
        "h-12 flex-row items-center justify-center rounded-md px-4",
        container[variant],
        isDisabled && "opacity-50",
        className,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text className={cn("font-semibold", label[variant])}>{title}</Text>
      )}
    </Pressable>
  );
}
