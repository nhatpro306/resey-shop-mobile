import { Text as RNText, type TextProps } from "react-native";
import { cn } from "@/lib/cn";

type Variant = "display" | "h1" | "h2" | "body" | "small" | "caption";

const styles: Record<Variant, string> = {
  display: "text-3xl font-bold text-text",
  h1: "text-2xl font-bold text-text",
  h2: "text-xl font-semibold text-text",
  body: "text-base text-text",
  small: "text-sm text-muted",
  caption: "text-xs text-muted",
};

export interface TextUIProps extends TextProps {
  variant?: Variant;
  className?: string;
}

export function Text({ variant = "body", className, ...props }: TextUIProps) {
  return <RNText className={cn(styles[variant], className)} {...props} />;
}
