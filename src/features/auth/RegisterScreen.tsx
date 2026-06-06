import { useState } from "react";
import { View, ScrollView, Alert, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authService } from "@/domain/services/auth";
import { registerSchema, type RegisterInput } from "./schemas";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { BrandMark } from "@/ui/BrandMark";
import type { AppError } from "@/domain/errors";

export function RegisterScreen() {
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    setLoading(true);
    try {
      await authService.signUp(data.email, data.password);
      Alert.alert("Kiểm tra email của bạn", "Chúng tôi đã gửi cho bạn một liên kết xác nhận.", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (e) {
      const err = e as AppError;
      Alert.alert("Đăng ký thất bại", err.message ?? "Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  const fields: { name: keyof RegisterInput; label: string; placeholder: string; secure?: boolean }[] = [
    { name: "email", label: "Email", placeholder: "you@email.com" },
    { name: "password", label: "Mật khẩu", placeholder: "••••••••", secure: true },
    { name: "confirmPassword", label: "Xác nhận mật khẩu", placeholder: "••••••••", secure: true },
  ];

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView contentContainerClassName="flex-1 justify-center px-6 gap-8" keyboardShouldPersistTaps="handled">
        <View className="gap-6">
          <BrandMark />
          <View className="gap-1">
            <Text variant="h1">Tạo tài khoản</Text>
            <Text variant="small">Gia nhập RESEY</Text>
          </View>
        </View>

        <View className="gap-4">
          {fields.map(({ name, label, placeholder, secure }) => (
            <Controller
              key={name}
              control={control}
              name={name}
              render={({ field: { onChange, value } }) => (
                <Input
                  label={label}
                  placeholder={placeholder}
                  autoCapitalize="none"
                  keyboardType={name === "email" ? "email-address" : "default"}
                  autoComplete={name === "email" ? "email" : "new-password"}
                  textContentType={name === "email" ? "emailAddress" : "newPassword"}
                  password={secure}
                  value={value}
                  onChangeText={onChange}
                  error={errors[name]?.message}
                />
              )}
            />
          ))}
        </View>

        <View className="gap-4">
          <Button title="Tạo tài khoản" loading={loading} onPress={handleSubmit(onSubmit)} />
          <View className="flex-row justify-center gap-2">
            <Text variant="small">Đã có tài khoản?</Text>
            <Pressable onPress={() => router.back()} accessibilityRole="link">
              <Text variant="small" className="text-primary font-semibold">Đăng nhập</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
