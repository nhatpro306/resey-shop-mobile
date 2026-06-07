import React, { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authService } from "@/domain/services/auth";
import { forgotPasswordSchema, type ForgotPasswordInput } from "./schemas";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";

export function ForgotPasswordScreen() {
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordInput) {
    setLoading(true);
    try {
      await authService.resetPassword(data.email);
      Alert.alert("Đã gửi email", "Vui lòng kiểm tra hộp thư để nhận liên kết đặt lại mật khẩu.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Lỗi", "Không gửi được email đặt lại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView contentContainerClassName="flex-1 justify-center gap-6 px-6" keyboardShouldPersistTaps="handled">
        <View className="gap-1">
          <Text variant="h1">Quên mật khẩu</Text>
          <Text variant="small">Chúng tôi sẽ gửi liên kết đặt lại đến email của bạn.</Text>
        </View>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Email"
              placeholder="you@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              value={value}
              onChangeText={onChange}
              error={errors.email?.message}
            />
          )}
        />

        <Button title="Gửi liên kết đặt lại" loading={loading} onPress={handleSubmit(onSubmit)} />
        <Button title="Quay lại" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}
