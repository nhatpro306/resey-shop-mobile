import React, { useState } from "react";
import { View, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Feather from "@expo/vector-icons/Feather";
import { useCart } from "@/features/cart/hooks";
import { usePlaceOrder } from "@/features/orders/hooks";
import { useAddresses } from "@/features/account/hooks";
import { useAuth } from "@/features/auth/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getStoreSettings } from "@/domain/services/settings";
import { qk } from "@/domain/services/keys";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { formatVnd } from "@/lib/currency";
import { tokens } from "@/config/theme";
import { cn } from "@/lib/cn";
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

function SelectRow({ selected, children, onPress }: { selected: boolean; children: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={cn("flex-row items-center gap-3 border bg-surface p-3", selected ? "border-primary" : "border-border")}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <Feather
        name={selected ? "check-circle" : "circle"}
        size={18}
        color={selected ? tokens.color.primary : tokens.color.muted}
      />
      <View className="flex-1">{children}</View>
    </Pressable>
  );
}

export function CheckoutScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
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

  const fieldDef: { name: keyof FormData; label: string; keyboard?: any }[] = [
    { name: "customerName", label: "Full name" },
    { name: "customerPhone", label: "Phone number", keyboard: "phone-pad" },
    { name: "customerEmail", label: "Email (optional)", keyboard: "email-address" },
    { name: "customerNote", label: "Order note (optional)" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <ScrollView contentContainerClassName="gap-6 px-4 pb-6 pt-4" keyboardShouldPersistTaps="handled">
        <View>
          <Text variant="overline" className="text-muted">Almost there</Text>
          <Text variant="h1">Checkout</Text>
        </View>

        {/* Contact */}
        <View className="gap-3">
          <Text variant="overline" className="text-muted">Contact info</Text>
          {fieldDef.map(({ name, label, keyboard }) => (
            <Controller
              key={name}
              control={control}
              name={name}
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder={label}
                  keyboardType={keyboard ?? "default"}
                  autoCapitalize={name === "customerEmail" ? "none" : "sentences"}
                  value={value ?? ""}
                  onChangeText={onChange}
                  error={errors[name]?.message}
                  accessibilityLabel={label}
                />
              )}
            />
          ))}
        </View>

        {/* Address */}
        <View className="gap-2">
          <Text variant="overline" className="text-muted">Shipping address</Text>
          {(addresses ?? []).length === 0 ? (
            <Button title="Add address" variant="secondary" onPress={() => router.push("/add-address" as any)} />
          ) : (
            (addresses ?? []).map((a) => (
              <SelectRow key={a.id} selected={selectedAddressId === a.id} onPress={() => setSelectedAddressId(a.id)}>
                <Text variant="small">{a.street}, {a.city}</Text>
                {a.state ? <Text variant="caption" className="text-muted">{a.state}, {a.country}</Text> : null}
              </SelectRow>
            ))
          )}
        </View>

        {/* Payment */}
        <View className="gap-2">
          <Text variant="overline" className="text-muted">Payment method</Text>
          {(["cod", "bank_transfer"] as PaymentMethod[]).map((method) => (
            <SelectRow key={method} selected={paymentMethod === method} onPress={() => setPaymentMethod(method)}>
              <Text variant="small" className="font-semibold">
                {method === "cod" ? "Cash on delivery (COD)" : "Bank transfer"}
              </Text>
            </SelectRow>
          ))}

          {paymentMethod === "bank_transfer" && settings?.bank_name ? (
            <View className="gap-1 bg-surface p-3">
              <Text variant="overline" className="text-muted">Bank details</Text>
              <Text variant="caption">{settings.bank_name}</Text>
              <Text variant="caption">{settings.bank_account_number}</Text>
              <Text variant="caption">{settings.bank_account_name}</Text>
              <Text variant="caption" className="mt-1 text-muted">
                Order will be confirmed after transfer is verified.
              </Text>
            </View>
          ) : null}
        </View>

        {/* Summary */}
        <View className="gap-2 bg-surface p-4">
          <Text variant="overline" className="text-muted">Order summary</Text>
          <View className="flex-row justify-between">
            <Text variant="caption">Subtotal</Text>
            <Text variant="caption">{formatVnd(subtotal)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text variant="caption">Shipping</Text>
            <Text variant="caption">{shippingFee === 0 ? "Free" : formatVnd(shippingFee)}</Text>
          </View>
          <View className="flex-row justify-between border-t border-border pt-2">
            <Text variant="small" className="font-bold">Total</Text>
            <Text variant="small" className="font-bold text-primary">{formatVnd(total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View
        className="border-t border-border bg-bg px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <Button title="Place order" loading={placeOrder.isPending} onPress={handleSubmit(onSubmit)} />
      </View>
    </SafeAreaView>
  );
}
