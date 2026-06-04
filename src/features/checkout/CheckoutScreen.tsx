import React, { useState } from "react";
import { View, ScrollView, TextInput, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart } from "@/features/cart/hooks";
import { usePlaceOrder } from "@/features/orders/hooks";
import { useAddresses } from "@/features/account/hooks";
import { useAuth } from "@/features/auth/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getStoreSettings } from "@/domain/services/settings";
import { qk } from "@/domain/services/keys";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { formatVnd } from "@/lib/currency";
import type { PaymentMethod } from "@/domain/types";
import type { AppError } from "@/domain/errors";
import { track } from "@/lib/analytics";
import * as Haptics from "expo-haptics";

const schema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerPhone: z.string().min(8, "Phone is required"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerNote: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function CheckoutScreen() {
  const { user } = useAuth();
  const { data: cart } = useCart(user?.id ?? null);
  const { data: addresses } = useAddresses(user?.id ?? null);
  const { data: settings } = useQuery({ queryKey: qk.storeSettings(), queryFn: getStoreSettings });
  const placeOrder = usePlaceOrder(user?.id ?? null);

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    addresses?.find((a) => a.is_default)?.id ?? addresses?.[0]?.id ?? null,
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");

  const items = cart?.cart_items ?? [];
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingFee =
    settings?.free_shipping_threshold && subtotal >= settings.free_shipping_threshold
      ? 0
      : settings?.shipping_fee ?? 0;
  const total = subtotal + shippingFee;

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    if (!selectedAddressId) { Alert.alert("Please select a shipping address"); return; }
    if (items.length === 0) { Alert.alert("Your cart is empty"); return; }

    try {
      const order = await placeOrder.mutateAsync({
        cartId: cart?.id,
        shippingAddressId: selectedAddressId,
        paymentMethod,
        shippingFee,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || undefined,
        customerNote: data.customerNote,
        items: items.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id ? String(i.variant_id) : null,
          quantity: i.quantity,
          selected_size: i.selected_size,
          selected_color: i.selected_color,
        })),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      track("purchase", { orderId: order.id, total, paymentMethod });
      router.replace(`/order-confirmation?id=${order.id}` as any);
    } catch (e) {
      const err = e as AppError;
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Order failed", err.message);
    }
  }

  const fieldDef: { name: keyof FormData; label: string; keyboard?: any; secure?: boolean }[] = [
    { name: "customerName", label: "Full name" },
    { name: "customerPhone", label: "Phone number", keyboard: "phone-pad" },
    { name: "customerEmail", label: "Email (optional)", keyboard: "email-address" },
    { name: "customerNote", label: "Order note (optional)" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <ScrollView contentContainerClassName="gap-5 px-4 pt-4 pb-6" keyboardShouldPersistTaps="handled">
        <Text variant="h2">Checkout</Text>

        {/* Contact */}
        <View className="gap-3">
          <Text variant="small" className="font-semibold">Contact info</Text>
          {fieldDef.map(({ name, label, keyboard }) => (
            <View key={name} className="gap-1">
              <Controller
                control={control}
                name={name}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    className="h-12 rounded-md border border-border bg-surface px-4 text-text text-sm"
                    placeholder={label}
                    placeholderTextColor="#A1A1AA"
                    keyboardType={keyboard ?? "default"}
                    value={value ?? ""}
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

        {/* Address */}
        <View className="gap-2">
          <Text variant="small" className="font-semibold">Shipping address</Text>
          {(addresses ?? []).length === 0 ? (
            <Button title="Add address" variant="secondary" onPress={() => router.push("/add-address" as any)} />
          ) : (
            (addresses ?? []).map((a) => (
              <Pressable
                key={a.id}
                onPress={() => setSelectedAddressId(a.id)}
                className={`rounded-lg border p-3 ${
                  selectedAddressId === a.id ? "border-primary" : "border-border"
                } bg-surface`}
                accessibilityRole="radio"
              >
                <Text variant="small">{a.street}, {a.city}</Text>
                {a.state ? <Text variant="caption" className="text-muted">{a.state}, {a.country}</Text> : null}
              </Pressable>
            ))
          )}
        </View>

        {/* Payment */}
        <View className="gap-2">
          <Text variant="small" className="font-semibold">Payment method</Text>
          {(["cod", "bank_transfer"] as PaymentMethod[]).map((method) => (
            <Pressable
              key={method}
              onPress={() => setPaymentMethod(method)}
              className={`rounded-lg border p-3 ${
                paymentMethod === method ? "border-primary" : "border-border"
              } bg-surface`}
              accessibilityRole="radio"
            >
              <Text variant="small" className="font-semibold">
                {method === "cod" ? "Cash on delivery (COD)" : "Bank transfer"}
              </Text>
            </Pressable>
          ))}

          {paymentMethod === "bank_transfer" && settings?.bank_name && (
            <View className="rounded-lg bg-surface p-3 gap-1">
              <Text variant="caption" className="font-semibold">Bank details</Text>
              <Text variant="caption">{settings.bank_name}</Text>
              <Text variant="caption">{settings.bank_account_number}</Text>
              <Text variant="caption">{settings.bank_account_name}</Text>
              <Text variant="caption" className="text-muted mt-1">
                Order will be confirmed after transfer is verified.
              </Text>
            </View>
          )}
        </View>

        {/* Summary */}
        <View className="rounded-lg bg-surface p-4 gap-2">
          <Text variant="small" className="font-semibold">Order summary</Text>
          <View className="flex-row justify-between">
            <Text variant="caption">Subtotal</Text>
            <Text variant="caption">{formatVnd(subtotal)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text variant="caption">Shipping</Text>
            <Text variant="caption">{shippingFee === 0 ? "Free" : formatVnd(shippingFee)}</Text>
          </View>
          <View className="border-t border-border pt-2 flex-row justify-between">
            <Text variant="small" className="font-bold">Total</Text>
            <Text variant="small" className="font-bold text-primary">{formatVnd(total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View className="border-t border-border bg-bg px-4 py-3">
        <Button
          title="Place order"
          loading={placeOrder.isPending}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </SafeAreaView>
  );
}
