import { useState } from "react";
import { View, TextInput, Pressable, type TextInputProps } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Text } from "./Text";
import { cn } from "@/lib/cn";
import { tokens } from "@/config/theme";

interface InputProps extends Omit<TextInputProps, "secureTextEntry"> {
  label?: string;
  error?: string;
  password?: boolean;
  containerClassName?: string;
}

export function Input({ label, error, password, containerClassName, onFocus, onBlur, accessibilityLabel, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!password);

  return (
    <View className={cn("gap-1.5", containerClassName)}>
      {label ? <Text variant="overline" className="text-muted">{label}</Text> : null}
      <View
        className={cn(
          "h-12 flex-row items-center border bg-surface px-4",
          focused ? "border-primary" : "border-border",
          error && "border-danger",
        )}
      >
        <TextInput
          className="flex-1 text-text"
          placeholderTextColor={tokens.color.muted}
          secureTextEntry={password ? hidden : false}
          accessibilityLabel={accessibilityLabel ?? label}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          {...props}
        />
        {password ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
          >
            <Feather name={hidden ? "eye" : "eye-off"} size={18} color={tokens.color.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text variant="caption" className="text-danger">{error}</Text> : null}
    </View>
  );
}
