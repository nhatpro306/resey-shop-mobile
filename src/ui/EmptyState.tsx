import { View } from "react-native";
import { Text } from "./Text";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8 py-12">
      <Text variant="h2" className="text-center">{title}</Text>
      {subtitle ? <Text variant="small" className="text-center">{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} className="mt-2" />
      ) : null}
    </View>
  );
}
