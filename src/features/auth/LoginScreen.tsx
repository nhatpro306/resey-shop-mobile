import { useState } from "react";
import { View, ScrollView, Alert, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authService } from "@/domain/services/auth";
import { loginSchema, type LoginInput } from "./schemas";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { BrandMark } from "@/ui/BrandMark";
import type { AppError } from "@/domain/errors";

export function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setLoading(true);
    try {
      await authService.signIn(data.email, data.password);
      router.replace("/(tabs)");
    } catch (e) {
      const err = e as AppError;
      Alert.alert("Sign in failed", err.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView contentContainerClassName="flex-1 justify-center px-6 gap-8" keyboardShouldPersistTaps="handled">
        <View className="gap-6">
          <BrandMark />
          <View className="gap-1">
            <Text variant="h1">Sign in</Text>
            <Text variant="small">Welcome back to RESEY</Text>
          </View>
        </View>

        <View className="gap-4">
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
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Password"
                placeholder="••••••••"
                password
                autoComplete="current-password"
                textContentType="password"
                value={value}
                onChangeText={onChange}
                error={errors.password?.message}
              />
            )}
          />

          <Pressable
            onPress={() => router.push("/(auth)/forgot-password")}
            className="self-end"
            accessibilityRole="link"
          >
            <Text variant="small" className="text-primary">Forgot password?</Text>
          </Pressable>
        </View>

        <View className="gap-4">
          <Button title="Sign in" loading={loading} onPress={handleSubmit(onSubmit)} />
          <View className="flex-row justify-center gap-2">
            <Text variant="small">No account?</Text>
            <Pressable onPress={() => router.push("/(auth)/register")} accessibilityRole="link">
              <Text variant="small" className="text-primary font-semibold">Register</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
