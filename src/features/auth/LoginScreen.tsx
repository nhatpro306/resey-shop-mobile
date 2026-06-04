import React, { useState } from "react";
import { View, TextInput, Pressable, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authService } from "@/domain/services/auth";
import { loginSchema, type LoginInput } from "./schemas";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
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
      <ScrollView contentContainerClassName="flex-1 justify-center px-6 gap-6" keyboardShouldPersistTaps="handled">
        <View className="gap-1">
          <Text variant="h1">Sign in</Text>
          <Text variant="small">Welcome back to RESEY</Text>
        </View>

        <View className="gap-4">
          <View className="gap-1">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="h-12 rounded-md border border-border bg-surface px-4 text-text"
                  placeholder="Email"
                  placeholderTextColor="#A1A1AA"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={value}
                  onChangeText={onChange}
                  accessibilityLabel="Email"
                />
              )}
            />
            {errors.email && <Text variant="caption" className="text-danger">{errors.email.message}</Text>}
          </View>

          <View className="gap-1">
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="h-12 rounded-md border border-border bg-surface px-4 text-text"
                  placeholder="Password"
                  placeholderTextColor="#A1A1AA"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  accessibilityLabel="Password"
                />
              )}
            />
            {errors.password && <Text variant="caption" className="text-danger">{errors.password.message}</Text>}
          </View>
        </View>

        <Button title="Sign in" loading={loading} onPress={handleSubmit(onSubmit)} />

        <View className="flex-row justify-center gap-2">
          <Text variant="small">No account?</Text>
          <Pressable onPress={() => router.push("/(auth)/register")} accessibilityRole="link">
            <Text variant="small" className="text-primary font-semibold">Register</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push("/(auth)/forgot-password")}
          className="items-center"
          accessibilityRole="link"
        >
          <Text variant="small" className="text-primary">Forgot password?</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
