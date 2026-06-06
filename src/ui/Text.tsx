import { Text as RNText, type TextProps } from "react-native";
import { cn } from "@/lib/cn";

type Variant = "display" | "h1" | "h2" | "cardtitle" | "body" | "small" | "caption" | "overline" | "eyebrow";

const styles: Record<Variant, string> = {
  display: "text-3xl font-black uppercase tracking-tight text-fg",
  h1: "text-2xl font-black uppercase tracking-tight text-fg",
  h2: "text-xl font-black uppercase text-fg",
  cardtitle: "text-xs font-bold uppercase tracking-[0.05em] text-fg",
  body: "text-base text-fg-muted leading-relaxed",
  small: "text-sm text-fg-muted",
  caption: "text-xs text-fg-subtle",
  overline: "text-[11px] font-bold uppercase tracking-[0.24em] text-fg-subtle",
  eyebrow: "text-[11px] font-bold uppercase tracking-[0.24em] text-fg-subtle",
};

export interface TextUIProps extends TextProps {
  variant?: Variant;
  className?: string;
}

export function Text({ variant = "body", className, ...props }: TextUIProps) {
  return <RNText className={cn(styles[variant], className)} {...props} />;
}
