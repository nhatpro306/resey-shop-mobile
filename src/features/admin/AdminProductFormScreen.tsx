import React, { useEffect } from "react";
import { View, ScrollView, TextInput, Pressable, Alert, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useAdminProduct, useCreateProduct, useUpdateAdminProduct,
  useUploadProductImage, useDeleteProductImage,
} from "./hooks";
import { productFormSchema, type ProductFormInput } from "./schemas";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { Skeleton } from "@/ui/Skeleton";
import type { AppError } from "@/domain/errors";

const TEXT_FIELDS: { name: keyof ProductFormInput; label: string; keyboard?: "numeric" | "default"; multiline?: boolean }[] = [
  { name: "title", label: "Title" },
  { name: "description", label: "Description", multiline: true },
  { name: "material", label: "Material (optional)" },
  { name: "price", label: "Price (VND)", keyboard: "numeric" },
  { name: "sale_price", label: "Sale price (optional)", keyboard: "numeric" },
  { name: "stock", label: "Stock", keyboard: "numeric" },
  { name: "sku", label: "SKU (optional)" },
];

export function AdminProductFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id && id !== "new";
  const productId = isEdit ? (id as string) : null;

  const { data: product, isLoading } = useAdminProduct(productId);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateAdminProduct(productId ?? "");
  const uploadImage = useUploadProductImage(productId ?? "");
  const deleteImage = useDeleteProductImage(productId ?? "");

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: { is_active: true, price: 0, stock: 0 },
  });

  useEffect(() => {
    if (product) {
      reset({
        title: product.title,
        description: product.description ?? "",
        material: product.material ?? "",
        price: product.price,
        sale_price: product.sale_price ?? undefined,
        stock: product.stock,
        sku: product.sku ?? "",
        is_active: product.is_active,
      });
    }
  }, [product, reset]);

  const isActive = watch("is_active");

  async function pickAndUpload() {
    if (!productId) { Alert.alert("Save the product first", "Create the product before adding images."); return; }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permission needed", "Allow photo access."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    try {
      const count = product?.images?.length ?? 0;
      await uploadImage.mutateAsync({
        uri: asset.uri,
        mime: asset.mimeType ?? "image/jpeg",
        isPrimary: count === 0,
        sortOrder: count,
      });
    } catch (e) {
      Alert.alert("Upload failed", (e as AppError).message);
    }
  }

  async function onSubmit(data: ProductFormInput) {
    // Empty sale price coerces to 0 — store as null ("no sale").
    const payload = { ...data, sale_price: data.sale_price ? data.sale_price : null };
    try {
      if (isEdit && productId) {
        await updateProduct.mutateAsync(payload);
        router.back();
      } else {
        const created = await createProduct.mutateAsync(payload);
        // Navigate to edit mode so images can be added to the new product.
        router.replace(`/admin/product/${created.product_id}` as any);
      }
    } catch (e) {
      Alert.alert("Error", (e as AppError).message);
    }
  }

  if (isEdit && isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg px-4 pt-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-md" />)}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-row items-center justify-between border-b border-border px-4 pb-3 pt-4">
        <Text variant="h2" className="text-base">{isEdit ? "Edit product" : "New product"}</Text>
        <Button title="Cancel" variant="ghost" size="sm" onPress={() => router.back()} />
      </View>
      <ScrollView contentContainerClassName="gap-4 px-4 pt-4 pb-6" keyboardShouldPersistTaps="handled">

        {TEXT_FIELDS.map(({ name, label, keyboard, multiline }) => (
          <View key={name} className="gap-1">
            <Text variant="caption" className="text-muted">{label}</Text>
            <Controller
              control={control}
              name={name}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className={`rounded-md border border-border bg-surface px-4 text-text text-sm ${multiline ? "h-24 py-3" : "h-12"}`}
                  placeholder={label}
                  placeholderTextColor="#A1A1AA"
                  keyboardType={keyboard ?? "default"}
                  multiline={multiline}
                  textAlignVertical={multiline ? "top" : "center"}
                  value={value != null ? String(value) : ""}
                  onChangeText={onChange}
                  accessibilityLabel={label}
                />
              )}
            />
            {errors[name] && <Text variant="caption" className="text-danger">{errors[name]?.message as string}</Text>}
          </View>
        ))}

        {/* Active toggle */}
        <Pressable
          onPress={() => setValue("is_active", !isActive)}
          className="flex-row items-center gap-3 py-1"
          accessibilityRole="switch"
          accessibilityState={{ checked: !!isActive }}
        >
          <View className={`h-5 w-5 items-center justify-center rounded border ${isActive ? "border-primary bg-primary" : "border-border"}`}>
            {isActive && <Text className="text-primary-fg text-xs">✓</Text>}
          </View>
          <Text variant="small">Active (visible in store)</Text>
        </Pressable>

        {/* Images (edit mode only) */}
        {isEdit && (
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text variant="small" className="font-semibold">Images</Text>
              <Button title="+ Add image" variant="secondary" className="h-8 px-3" loading={uploadImage.isPending} onPress={pickAndUpload} />
            </View>
            <FlatList
              horizontal
              data={product?.images ?? []}
              keyExtractor={(img) => String(img.id)}
              contentContainerClassName="gap-2"
              ListEmptyComponent={<Text variant="caption" className="text-muted">No images yet.</Text>}
              renderItem={({ item: img }) => (
                <Pressable
                  onLongPress={() =>
                    Alert.alert("Delete image?", "", [
                      { text: "Cancel", style: "cancel" },
                      { text: "Delete", style: "destructive", onPress: () => deleteImage.mutate(img.id) },
                    ])
                  }
                  accessibilityLabel="Product image (long-press to delete)"
                >
                  <Image
                    source={img.url}
                    style={{ width: 88, height: 88, borderRadius: 8 }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                  {img.is_primary && (
                    <View className="absolute left-1 top-1 rounded bg-primary px-1">
                      <Text className="text-primary-fg" style={{ fontSize: 9 }}>Primary</Text>
                    </View>
                  )}
                </Pressable>
              )}
            />
            <Text variant="caption" className="text-muted">Long-press an image to delete.</Text>
          </View>
        )}
      </ScrollView>

      <View className="border-t border-border bg-bg px-4 py-3">
        <Button
          title={isEdit ? "Save changes" : "Create product"}
          loading={createProduct.isPending || updateProduct.isPending}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </SafeAreaView>
  );
}
