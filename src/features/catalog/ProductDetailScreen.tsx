import React, { useState, useCallback } from "react";
import { View, ScrollView, Pressable, Alert, FlatList, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useProduct } from "./hooks";
import { useAddToCart } from "@/features/cart/hooks";
import { useReviews } from "@/features/account/hooks";
import { useAuth } from "@/features/auth/AuthContext";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { Skeleton } from "@/ui/Skeleton";
import { Badge } from "@/ui/Badge";
import { formatVnd } from "@/lib/currency";
import { getResizedImageUrl } from "@/domain/services/storage";
import type { ProductVariantType } from "@/domain/types";
import type { AppError } from "@/domain/errors";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

export function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: product, isLoading, isError, refetch } = useProduct(slug ?? "");
  const { user } = useAuth();
  const addToCart = useAddToCart(user?.id ?? null);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const images = product?.images?.length
    ? product.images.sort((a, b) => a.sort_order - b.sort_order).map((i) => i.url)
    : product?.image
    ? [product.image]
    : [];

  const selectedVariant: ProductVariantType | undefined = product?.variants?.find(
    (v) =>
      v.is_active &&
      (selectedSize ? v.size === selectedSize : true) &&
      (selectedColor ? v.color === selectedColor : true),
  );

  const displayPrice = selectedVariant?.price_override ?? product?.sale_price ?? product?.price ?? 0;
  const inStock = (selectedVariant?.stock ?? product?.stock ?? 0) > 0;
  const { data: reviews } = useReviews(product?.product_id ?? "");

  async function handleAddToCart() {
    if (!user) { router.push("/(auth)/login"); return; }
    if (!product) return;

    try {
      await addToCart.mutateAsync({
        productId: product.product_id,
        price: displayPrice,
        quantity: qty,
        opts: {
          variantId: selectedVariant ? Number(selectedVariant.id) : undefined,
          size: selectedSize ?? undefined,
          color: selectedColor ?? undefined,
        },
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Added to cart", product.title);
    } catch (e) {
      const err = e as AppError;
      Alert.alert("Error", err.message);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <Skeleton className="h-96 w-full" />
        <View className="gap-3 px-4 pt-4">
          <Skeleton className="h-6 w-3/4 rounded" />
          <Skeleton className="h-4 w-1/3 rounded" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !product) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg gap-4">
        <Text variant="body">Could not load product.</Text>
        <Button title="Retry" onPress={() => refetch()} />
        <Button title="Go back" variant="ghost" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const sizes = product.variants
    ? [...new Set(product.variants.filter((v) => v.is_active && v.size).map((v) => v.size!))]
    : product.sizes ?? [];
  const colors = product.variants
    ? [...new Set(product.variants.filter((v) => v.is_active && v.color).map((v) => v.color!))]
    : product.colors ?? [];

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image gallery */}
        <FlatList
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={images}
          keyExtractor={(url, i) => `${url}-${i}`}
          renderItem={({ item: url }) => (
            <Image
              source={getResizedImageUrl(url, 800)}
              style={{ width, height: width }}
              contentFit="cover"
              cachePolicy="memory-disk"
              placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
            />
          )}
        />

        <View className="gap-4 px-4 py-4">
          {/* Title + price */}
          <View className="gap-1">
            <Text variant="h2">{product.title}</Text>
            <View className="flex-row items-center gap-3">
              <Text variant="h2" className="text-primary font-bold">{formatVnd(displayPrice)}</Text>
              {product.sale_price && product.sale_price < product.price && (
                <Text variant="small" className="text-muted line-through">{formatVnd(product.price)}</Text>
              )}
            </View>
          </View>

          {/* Stock badge */}
          <Badge
            label={inStock ? "In stock" : "Out of stock"}
            variant={inStock ? "success" : "danger"}
          />

          {/* Sizes */}
          {sizes.length > 0 && (
            <View className="gap-2">
              <Text variant="small" className="font-semibold">Size</Text>
              <FlatList
                horizontal
                data={sizes}
                keyExtractor={(s) => s}
                contentContainerClassName="gap-2"
                renderItem={({ item: size }) => {
                  const variantForSize = product.variants?.find((v) => v.size === size && v.is_active);
                  const outOfStock = variantForSize ? variantForSize.stock === 0 : false;
                  return (
                    <Pressable
                      onPress={() => !outOfStock && setSelectedSize(selectedSize === size ? null : size)}
                      className={`rounded-md border px-4 py-2 ${
                        selectedSize === size
                          ? "border-primary bg-primary"
                          : "border-border bg-surface"
                      } ${outOfStock ? "opacity-40" : ""}`}
                      disabled={outOfStock}
                      accessibilityRole="button"
                      accessibilityLabel={`Size ${size}`}
                    >
                      <Text variant="small" className={selectedSize === size ? "text-primary-fg font-semibold" : ""}>
                        {size}
                      </Text>
                    </Pressable>
                  );
                }}
              />
            </View>
          )}

          {/* Colors */}
          {colors.length > 0 && (
            <View className="gap-2">
              <Text variant="small" className="font-semibold">Color</Text>
              <FlatList
                horizontal
                data={colors}
                keyExtractor={(c) => c}
                contentContainerClassName="gap-2"
                renderItem={({ item: color }) => (
                  <Pressable
                    onPress={() => setSelectedColor(selectedColor === color ? null : color)}
                    className={`rounded-md border px-4 py-2 ${
                      selectedColor === color ? "border-primary bg-primary" : "border-border bg-surface"
                    }`}
                    accessibilityRole="button"
                    accessibilityLabel={`Color ${color}`}
                  >
                    <Text variant="small" className={selectedColor === color ? "text-primary-fg font-semibold" : ""}>
                      {color}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          )}

          {/* Quantity */}
          <View className="flex-row items-center gap-4">
            <Text variant="small" className="font-semibold">Qty</Text>
            <Pressable onPress={() => setQty(Math.max(1, qty - 1))} className="h-8 w-8 items-center justify-center rounded border border-border">
              <Text>-</Text>
            </Pressable>
            <Text>{qty}</Text>
            <Pressable onPress={() => setQty(qty + 1)} className="h-8 w-8 items-center justify-center rounded border border-border">
              <Text>+</Text>
            </Pressable>
          </View>

          {/* Description */}
          {product.description && (
            <View className="gap-1">
              <Text variant="small" className="font-semibold">Description</Text>
              <Text variant="small" className="text-muted">{product.description}</Text>
            </View>
          )}
          {product.material && (
            <View className="gap-1">
              <Text variant="small" className="font-semibold">Material</Text>
              <Text variant="small" className="text-muted">{product.material}</Text>
            </View>
          )}

          {/* Reviews */}
          {reviews && reviews.length > 0 && (
            <View className="gap-2">
              <Text variant="small" className="font-semibold">Reviews ({reviews.length})</Text>
              {reviews.slice(0, 3).map((r) => (
                <View key={r.id} className="rounded-md bg-surface p-3 gap-1">
                  <Text variant="caption" className="font-semibold">
                    {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                  </Text>
                  {r.comment ? <Text variant="caption" className="text-muted">{r.comment}</Text> : null}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View className="border-t border-border bg-bg px-4 py-3">
        <Button
          title={inStock ? "Add to cart" : "Out of stock"}
          loading={addToCart.isPending}
          disabled={!inStock}
          onPress={handleAddToCart}
        />
      </View>
    </SafeAreaView>
  );
}
