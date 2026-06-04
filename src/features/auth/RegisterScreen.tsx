import React, { useState } from "react";
import { View, TextInput, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authService } from "@/domain/services/auth";
import { registerSchema, type RegisterInput } from "./schemas";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
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
      Alert.alert("Check your email", "We sent you a confirmation link.", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (e) {
      const err = e as AppError;
      Alert.alert("Registration failed", err.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const fields: { name: keyof RegisterInput; label: string; secure?: boolean }[] = [
    { name: "email", label: "Email" },
    { name: "password", label: "Password", secure: true },
    { name: "confirmPassword", label: "Confirm password", secure: true },
  ];

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView contentContainerClassName="flex-1 justify-center px-6 gap-6" keyboardShouldPersistTaps="handled">
        <View className="gap-1">
          <Text variant="h1">Create account</Text>
          <Text variant="small">Join RESEY</Text>
        </View>

        <View className="gap-4">
          {fields.map(({ name, label, secure }) => (
            <View key={name} className="gap-1">
              <Controller
                control={control}
                name={name}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    className="h-12 rounded-md border border-border bg-surface px-4 text-text"
                    placeholder={label}
                    placeholderTextColor="#A1A1AA"
                    autoCapitalize="none"
                    keyboardType={name === "email" ? "email-address" : "default"}
                    secureTextEntry={secure}
                    value={value}
                    onChangeText={onChange}
                    accessibilityLabel={label}
                  />
                )}
              />
              {errors[name] && (
                <Text variant="caption" className="text-danger">{errors[name]?.message}</Text>
              )}
            </View>
          ))}
        </View>

        <Button title="Create account" loading={loading} onPress={handleSubmit(onSubmit)} />

        <View className="flex-row justify-center gap-2">
          <Text variant="small">Already have an account?</Text>
          <Button
            title="Sign in"
            variant="ghost"
            className="h-auto px-0"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
