import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { useThemeColors } from "@/config/theme";

export default function OrderConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useThemeColors();
  return (
    <SafeAreaView className="flex-1 items-center justify-center gap-5 bg-bg px-8">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-accent">
        <Feather name="check" size={40} color={c.onAccent} />
      </View>
      <Text variant="h1" className="text-center text-2xl">Đặt hàng thành công</Text>
      <Text variant="body" className="text-center text-sm">Cảm ơn bạn đã mua sắm tại RESEY.</Text>
      {id ? (
        <View className="items-center gap-1">
          <Text variant="eyebrow">Mã đơn</Text>
          <Text className="text-base font-bold text-fg">#{id}</Text>
        </View>
      ) : null}
      <View className="mt-2 w-full gap-3">
        <Button title="Theo dõi đơn hàng" variant="primary" full icon="package" onPress={() => router.replace(`/order/${id}` as any)} />
        <Button title="Tiếp tục mua sắm" variant="ghost" full onPress={() => router.replace("/(tabs)")} />
      </View>
    </SafeAreaView>
  );
}
