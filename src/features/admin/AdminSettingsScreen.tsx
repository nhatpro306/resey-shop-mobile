import React, { useEffect } from "react";
import { View, ScrollView, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStoreSettings, useUpdateStoreSettings } from "./hooks";
import { useAuth } from "@/features/auth/AuthContext";
import { storeSettingsSchema, type StoreSettingsInput } from "./schemas";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { Skeleton } from "@/ui/Skeleton";
import { EmptyState } from "@/ui/EmptyState";
import type { AppError } from "@/domain/errors";

const SECTIONS: { title: string; fields: { name: keyof StoreSettingsInput; label: string; keyboard?: "numeric" | "default" }[] }[] = [
  {
    title: "Branding",
    fields: [
      { name: "store_name", label: "Store name" },
      { name: "store_description", label: "Store description" },
      { name: "hero_title", label: "Hero title" },
      { name: "hero_subtitle", label: "Hero subtitle" },
    ],
  },
  {
    title: "Contact",
    fields: [
      { name: "contact_email", label: "Contact email" },
      { name: "contact_phone", label: "Contact phone" },
    ],
  },
  {
    title: "Banking (for bank transfer)",
    fields: [
      { name: "bank_name", label: "Bank name" },
      { name: "bank_account_number", label: "Account number" },
      { name: "bank_account_name", label: "Account holder name" },
    ],
  },
  {
    title: "Shipping",
    fields: [
      { name: "shipping_fee", label: "Shipping fee (VND)", keyboard: "numeric" },
      { name: "free_shipping_threshold", label: "Free shipping threshold (VND)", keyboard: "numeric" },
    ],
  },
];

export function AdminSettingsScreen() {
  const { isAdmin } = useAuth();
  const { data: settings, isLoading } = useStoreSettings();
  const updateSettings = useUpdateStoreSettings();

  const { control, handleSubmit, reset } = useForm<StoreSettingsInput>({
    resolver: zodResolver(storeSettingsSchema),
  });

  useEffect(() => {
    if (settings) {
      reset({
        store_name: settings.store_name ?? "",
        store_description: settings.store_description ?? "",
        hero_title: settings.hero_title ?? "",
        hero_subtitle: settings.hero_subtitle ?? "",
        contact_email: settings.contact_email ?? "",
        contact_phone: settings.contact_phone ?? "",
        bank_name: settings.bank_name ?? "",
        bank_account_number: settings.bank_account_number ?? "",
        bank_account_name: settings.bank_account_name ?? "",
        shipping_fee: settings.shipping_fee ?? 0,
        free_shipping_threshold: settings.free_shipping_threshold ?? 0,
      });
    }
  }, [settings, reset]);

  if (!isAdmin) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <EmptyState title="Access denied" subtitle="Admin only." actionLabel="Back" onAction={() => router.back()} />
      </SafeAreaView>
    );
  }

  async function onSubmit(data: StoreSettingsInput) {
    if (!settings?.id) { Alert.alert("Error", "Store settings not initialized."); return; }
    try {
      await updateSettings.mutateAsync({ id: settings.id, fields: data });
      Alert.alert("Saved", "Store settings updated.");
    } catch (e) {
      Alert.alert("Error", (e as AppError).message);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg px-4 pt-6 gap-3">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-md" />)}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <ScrollView contentContainerClassName="gap-5 px-4 pt-4 pb-6" keyboardShouldPersistTaps="handled">
        <Text variant="h2">Store settings</Text>

        {SECTIONS.map((section) => (
          <View key={section.title} className="gap-3">
            <Text variant="small" className="font-semibold text-muted">{section.title}</Text>
            {section.fields.map(({ name, label, keyboard }) => (
              <View key={name} className="gap-1">
                <Text variant="caption" className="text-muted">{label}</Text>
                <Controller
                  control={control}
                  name={name}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="h-12 rounded-md border border-border bg-surface px-4 text-text text-sm"
                      placeholder={label}
                      placeholderTextColor="#A1A1AA"
                      keyboardType={keyboard ?? "default"}
                      value={value != null ? String(value) : ""}
                      onChangeText={onChange}
                      accessibilityLabel={label}
                    />
                  )}
                />
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <View className="border-t border-border bg-bg px-4 py-3">
        <Button title="Save settings" loading={updateSettings.isPending} onPress={handleSubmit(onSubmit)} />
      </View>
    </SafeAreaView>
  );
}
