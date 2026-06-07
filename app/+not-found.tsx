import { View } from "react-native";
import { Link } from "expo-router";
import { Text } from "@/ui/Text";

export default function NotFound() {
  return (
    <View className="flex-1 items-center justify-center bg-bg gap-4">
      <Text variant="h1">404</Text>
      <Text variant="small" className="text-muted">Không tìm thấy trang này.</Text>
      <Link href="/(tabs)" className="text-primary">Về trang chủ</Link>
    </View>
  );
}
