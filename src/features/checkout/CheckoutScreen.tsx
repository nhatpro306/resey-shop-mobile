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
import { useThemeColors } from "@/config/theme";
import { cn } from "@/lib/cn";
import type { PaymentMethod } from "@/domain/types";
import type { AppError } from "@/domain/errors";
import { track } from "@/lib/analytics";
import * as Haptics from "expo-haptics";

const schema = z.object({
  customerName: z.string().min(2, "Vui lòng nhập họ tên"),
  customerPhone: z.string().min(8, "Vui lòng nhập số điện thoại"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerNote: z.string().optional(),
});
type FormData = z.infer<typeof schema>;
const STEPS = ["Liên hệ", "Thanh toán", "Xác nhận"];

function SelectRow({ selected, children, onPress }: { selected: boolean; children: React.ReactNode; onPress: () => void }) {
  const c = useThemeColors();
  return (
    <Pressable onPress={onPress} className={cn("flex-row items-center gap-3 border bg-surface p-3.5", selected ? "border-border-strong bg-surface-sunken" : "border-border")} accessibilityRole="radio" accessibilityState={{ selected }}>
      <Feather name={selected ? "check-circle" : "circle"} size={18} color={selected ? c.accent : c.fgSubtle} />
      <View className="flex-1">{children}</View>
    </Pressable>
  );
}

export function CheckoutScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const { data: cart } = useCart(user?.id ?? null);
  const { data: addresses } = useAddresses(user?.id ?? null);
  const { data: settings } = useQuery({ queryKey: qk.storeSettings(), queryFn: getStoreSettings });
  const placeOrder = usePlaceOrder(user?.id ?? null);

  const [step, setStep] = useState(0);
  const [manualAddressId, setManualAddressId] = useState<number | null>(null);
  const selectedAddressId =
    manualAddressId ?? addresses?.find((a) => a.is_default)?.id ?? addresses?.[0]?.id ?? null;
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");

  const items = cart?.cart_items ?? [];
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingFee = settings?.free_shipping_threshold && subtotal >= settings.free_shipping_threshold ? 0 : settings?.shipping_fee ?? 0;
  const total = subtotal + shippingFee;

  const { control, handleSubmit, getValues, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  function next() {
    if (step === 0) {
      const v = getValues();
      if (!v.customerName || v.customerName.length < 2 || !v.customerPhone || v.customerPhone.length < 8) {
        Alert.alert("Vui lòng điền đủ thông tin liên hệ"); return;
      }
      if (!selectedAddressId) { Alert.alert("Vui lòng chọn địa chỉ giao hàng"); return; }
    }
    if (step < 2) setStep(step + 1);
  }

  async function onSubmit(data: FormData) {
    if (!selectedAddressId) { Alert.alert("Vui lòng chọn địa chỉ giao hàng"); setStep(0); return; }
    if (items.length === 0) { Alert.alert("Giỏ hàng đang trống"); return; }
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
      router.replace(`/order/${order.id}` as any);
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Đặt hàng thất bại", (e as AppError).message);
    }
  }

  const contactFields: { name: keyof FormData; label: string; keyboard?: "default" | "phone-pad" | "email-address" }[] = [
    { name: "customerName", label: "Họ và tên" },
    { name: "customerPhone", label: "Số điện thoại", keyboard: "phone-pad" },
    { name: "customerEmail", label: "Email (tuỳ chọn)", keyboard: "email-address" },
    { name: "customerNote", label: "Ghi chú đơn hàng" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      {/* header + progress */}
      <View className="border-b border-border px-4 pb-4 pt-1">
        <View className="mb-4 flex-row items-center">
          <Pressable onPress={() => (step === 0 ? router.back() : setStep(step - 1))} hitSlop={8} className="h-9 w-9 items-center justify-center" accessibilityLabel="Quay lại">
            <Feather name="chevron-left" size={24} color={c.fg} />
          </Pressable>
          <Text variant="h2" className="flex-1 pr-9 text-center text-base">Thanh toán</Text>
        </View>
        <View
          className="flex-row items-center"
          accessibilityRole="progressbar"
          accessibilityLabel={`Bước ${step + 1} trong ${STEPS.length}: ${STEPS[step]}`}
        >
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <View
                className="items-center gap-1.5"
                accessibilityLabel={i < step ? `${s}: đã hoàn thành` : i === step ? `${s}: đang thực hiện` : `${s}: chưa tới`}
              >
                <View className={cn("h-[30px] w-[30px] items-center justify-center rounded-full border", i <= step ? "border-ink bg-ink" : "border-border bg-surface")}>
                  {i < step ? <Feather name="check" size={15} color={c.onInk} /> : <Text className={cn("text-xs font-extrabold", i <= step ? "text-ink-fg" : "text-fg-faint")}>{i + 1}</Text>}
                </View>
                <Text className={cn("text-[9.5px] font-bold uppercase tracking-[0.08em]", i <= step ? "text-fg" : "text-fg-faint")}>{s}</Text>
              </View>
              {i < 2 ? <View className={cn("mx-1.5 mb-5 h-[1.5px] flex-1", i < step ? "bg-ink" : "bg-border")} /> : null}
            </React.Fragment>
          ))}
        </View>
      </View>

      <ScrollView contentContainerClassName="gap-6 px-4 pb-28 pt-5" keyboardShouldPersistTaps="handled">
        {step === 0 ? (
          <>
            <View className="gap-3">
              <Text variant="eyebrow">Thông tin liên hệ</Text>
              {contactFields.map(({ name, label, keyboard }) => (
                <Controller
                  key={name}
                  control={control}
                  name={name}
                  render={({ field: { onChange, value } }) => (
                    <Input placeholder={label} keyboardType={keyboard ?? "default"} autoCapitalize={name === "customerEmail" ? "none" : "sentences"} autoComplete={name === "customerName" ? "name" : name === "customerPhone" ? "tel" : name === "customerEmail" ? "email" : "off"} textContentType={name === "customerName" ? "name" : name === "customerPhone" ? "telephoneNumber" : name === "customerEmail" ? "emailAddress" : "none"} value={value ?? ""} onChangeText={onChange} error={errors[name]?.message} accessibilityLabel={label} />
                  )}
                />
              ))}
            </View>
            <View className="gap-2">
              <Text variant="eyebrow">Địa chỉ giao hàng</Text>
              {(addresses ?? []).length === 0 ? (
                <Button title="Thêm địa chỉ" variant="soft" full onPress={() => router.push("/add-address" as any)} />
              ) : (
                (addresses ?? []).map((a) => (
                  <SelectRow key={a.id} selected={selectedAddressId === a.id} onPress={() => setManualAddressId(a.id)}>
                    <Text className="text-sm text-fg">{a.street}, {a.city}</Text>
                    {a.state ? <Text className="text-xs text-fg-subtle">{a.state}, {a.country}</Text> : null}
                  </SelectRow>
                ))
              )}
            </View>
          </>
        ) : null}

        {step === 1 ? (
          <View className="gap-2">
            <Text variant="eyebrow">Phương thức thanh toán</Text>
            {(["cod", "bank_transfer"] as PaymentMethod[]).map((m) => (
              <SelectRow key={m} selected={paymentMethod === m} onPress={() => setPaymentMethod(m)}>
                <View className="flex-row items-center gap-3">
                  <Feather name={m === "cod" ? "dollar-sign" : "credit-card"} size={20} color={c.fg} />
                  <Text className="text-sm font-semibold text-fg">{m === "cod" ? "Thanh toán khi nhận hàng (COD)" : "Chuyển khoản ngân hàng"}</Text>
                </View>
              </SelectRow>
            ))}
            {paymentMethod === "bank_transfer" && settings?.bank_name ? (
              <View className="gap-1 bg-surface-sunken p-3.5">
                <Text variant="eyebrow">Thông tin chuyển khoản</Text>
                <Text className="text-xs text-fg">{settings.bank_name}</Text>
                <Text className="text-xs text-fg">{settings.bank_account_number}</Text>
                <Text className="text-xs text-fg">{settings.bank_account_name}</Text>
                <Text className="mt-1 text-xs text-fg-subtle">Đơn sẽ được xác nhận sau khi nhận chuyển khoản.</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {step === 2 ? (
          <>
            <View className="gap-2">
              <Text variant="eyebrow">Sản phẩm ({items.length})</Text>
              {items.map((i) => (
                <View key={i.id} className="flex-row justify-between gap-2 border-b border-border py-2.5">
                  <Text className="flex-1 text-[13px] text-fg" numberOfLines={1}>{i.product?.title ?? "Sản phẩm"} × {i.quantity}</Text>
                  <Text className="text-[13px] font-semibold text-fg">{formatVnd(i.price * i.quantity)}</Text>
                </View>
              ))}
            </View>
            <View className="gap-2.5 bg-surface-sunken p-4">
              <Text variant="eyebrow">Tóm tắt đơn hàng</Text>
              <View className="flex-row justify-between"><Text className="text-[13px] text-fg-muted">Tạm tính</Text><Text className="text-[13px] text-fg">{formatVnd(subtotal)}</Text></View>
              <View className="flex-row justify-between"><Text className="text-[13px] text-fg-muted">Phí ship</Text><Text className={cn("text-[13px]", shippingFee === 0 ? "text-ok" : "text-fg")}>{shippingFee === 0 ? "Miễn phí" : formatVnd(shippingFee)}</Text></View>
              <View className="flex-row justify-between border-t border-border-strong pt-2.5"><Text className="text-sm font-extrabold uppercase text-fg">Tổng</Text><Text className="text-base font-extrabold text-accent">{formatVnd(total)}</Text></View>
            </View>
          </>
        ) : null}
      </ScrollView>

      <View className="absolute inset-x-0 bottom-0 border-t border-border bg-bg px-4 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        {step < 2 ? (
          <Button title="Tiếp tục" variant="primary" full icon="arrow-right" onPress={next} />
        ) : (
          <Button title="Đặt hàng" variant="primary" full loading={placeOrder.isPending} onPress={handleSubmit(onSubmit)} />
        )}
      </View>
    </SafeAreaView>
  );
}
