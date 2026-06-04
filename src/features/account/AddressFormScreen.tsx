import React, { useEffect } from "react";
import { View, ScrollView, TextInput, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAddresses, useSaveAddress, useUpdateAddress } from "./hooks";
import { useAuth } from "@/features/auth/AuthContext";
import { addressSchema, type AddressInput } from "./schemas";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import type { AppError } from "@/domain/errors";

const FIELDS: { name: keyof AddressInput; label: string }[] = [
  { name: "street", label: "Street address" },
  { name: "city", label: "City" },
  { name: "state", label: "State / Province (optional)" },
  { name: "zip_code", label: "Zip / Postal code (optional)" },
  { name: "country", label: "Country" },
];

export function AddressFormScreen() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const { data: addresses } = useAddresses(user?.id ?? null);
  const existing = isEdit ? addresses?.find((a) => a.id === Number(id)) : undefined;

  const saveAddr = useSaveAddress(user?.id ?? "");
  const updateAddr = useUpdateAddress(user?.id ?? "");

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: "Vietnam", is_default: false },
  });

  useEffect(() => {
    if (existing) {
      reset({
        street: existing.street,
        city: existing.city,
        state: existing.state ?? "",
        zip_code: existing.zip_code ?? "",
        country: existing.country,
        is_default: existing.is_default,
      });
    }
  }, [existing, reset]);

  const isDefault = watch("is_default");

  async function onSubmit(data: AddressInput) {
    try {
      const payload = { ...data, is_default: data.is_default ?? false };
      if (isEdit && existing) {
        await updateAddr.mutateAsync({ id: existing.id, fields: payload });
      } else {
        await saveAddr.mutateAsync(payload);
      }
      router.back();
    } catch (e) {
      Alert.alert("Error", (e as AppError).message);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <ScrollView contentContainerClassName="gap-4 px-4 pt-4 pb-6" keyboardShouldPersistTaps="handled">
        <Text variant="h2">{isEdit ? "Edit address" : "Add address"}</Text>

        {FIELDS.map(({ name, label }) => (
          <View key={name} className="gap-1">
            <Controller
              control={control}
              name={name}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="h-12 rounded-md border border-border bg-surface px-4 text-text text-sm"
                  placeholder={label}
                  placeholderTextColor="#A1A1AA"
                  value={(value as string) ?? ""}
                  onChangeText={onChange}
                  accessibilityLabel={label}
                />
              )}
            />
            {errors[name] && <Text variant="caption" className="text-danger">{errors[name]?.message}</Text>}
          </View>
        ))}

        <Pressable
          onPress={() => setValue("is_default", !isDefault)}
          className="flex-row items-center gap-3 py-2"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: !!isDefault }}
        >
          <View className={`h-5 w-5 items-center justify-center rounded border ${isDefault ? "border-primary bg-primary" : "border-border"}`}>
            {isDefault && <Text className="text-primary-fg text-xs">✓</Text>}
          </View>
          <Text variant="small">Set as default address</Text>
        </Pressable>
      </ScrollView>

      <View className="border-t border-border bg-bg px-4 py-3">
        <Button
          title={isEdit ? "Save changes" : "Add address"}
          loading={saveAddr.isPending || updateAddr.isPending}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </SafeAreaView>
  );
}
