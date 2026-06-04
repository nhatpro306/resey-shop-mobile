import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";

export default function OrderConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-bg gap-5 px-6">
      <Text variant="display" className="text-success">✓</Text>
      <Text variant="h1" className="text-center">Order placed!</Text>
      <Text variant="small" className="text-center text-muted">
        Your order #{id} has been received. We&apos;ll confirm it shortly.
      </Text>
      <Button title="View order" onPress={() => router.push(`/order/${id}` as any)} />
      <Button title="Continue shopping" variant="ghost" onPress={() => router.replace("/(tabs)")} />
    </SafeAreaView>
  );
}
