import React, { useState } from "react";
import { View, ScrollView, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authService } from "@/domain/services/auth";
import { forgotPasswordSchema, type ForgotPasswordInput } from "./schemas";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";

export function ForgotPasswordScreen() {
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordInput) {
    setLoading(true);
    try {
      await authService.resetPassword(data.email);
      Alert.alert("Email sent", "Check your inbox for the reset link.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "Could not send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView contentContainerClassName="flex-1 justify-center gap-6 px-6" keyboardShouldPersistTaps="handled">
        <View className="gap-1">
          <Text variant="h1">Forgot password</Text>
          <Text variant="small">We&apos;ll send a reset link to your email.</Text>
        </View>

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

        <Button title="Send reset link" loading={loading} onPress={handleSubmit(onSubmit)} />
        <Button title="Back" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}
