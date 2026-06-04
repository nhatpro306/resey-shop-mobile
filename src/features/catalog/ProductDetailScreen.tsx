import React, { useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Alert,
  FlatList,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import Feather from "@expo/vector-icons/Feather";
import { useProduct } from "./hooks";
import { useAddToCart } from "@/features/cart/hooks";
import { useReviews } from "@/features/account/hooks";
import { useAuth } from "@/features/auth/AuthContext";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { Skeleton } from "@/ui/Skeleton";
import { Badge } from "@/ui/Badge";
import { formatVnd } from "@/lib/currency";
import { getResizedImageUrl } from "@/lib/imageUrl";
import { tokens } from "@/config/theme";
import { cn } from "@/lib/cn";
import type { ProductVariantType } from "@/domain/types";
import type { AppError } from "@/domain/errors";
import { track } from "@/lib/analytics";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

function Chip({ active, disabled, label, onPress }: { active: boolean; disabled?: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={cn(
        "border px-4 py-2",
        active ? "border-primary bg-primary" : "border-border bg-surface",
        disabled && "opacity-40",
      )}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text variant="small" className={active ? "font-semibold text-primary-fg" : "text-text"}>{label}</Text>
    </Pressable>
  );
}

export function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const { data: product, isLoading, isError, refetch } = useProduct(slug ?? "");
  const { user } = useAuth();
  const addToCart = useAddToCart(user?.id ?? null);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [galleryIndex, setGalleryIndex] = useState(0);

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
  const stock = selectedVariant?.stock ?? product?.stock ?? 0;
  const inStock = stock > 0;
  const { data: reviews } = useReviews(product?.product_id ?? "");

  function onGalleryScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setGalleryIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  }

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
      track("add_to_cart", { productId: product.product_id, quantity: qty });
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
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !product) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-bg">
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
    <View className="flex-1 bg-bg">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image gallery */}
        <View>
          <FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={images}
            keyExtractor={(url, i) => `${url}-${i}`}
            onMomentumScrollEnd={onGalleryScroll}
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

          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            style={{ top: insets.top + 8 }}
            className="absolute left-4 h-10 w-10 items-center justify-center bg-bg/70"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather name="chevron-left" size={22} color={tokens.color.text} />
          </Pressable>

          {/* Gallery dots */}
          {images.length > 1 ? (
            <View className="absolute bottom-3 w-full flex-row justify-center gap-1.5">
              {images.map((url, i) => (
                <View
                  key={`${url}-${i}`}
                  className={cn("h-1.5", i === galleryIndex ? "w-5 bg-primary" : "w-1.5 bg-text/40")}
                />
              ))}
            </View>
          ) : null}
        </View>

        <View className="gap-5 px-4 py-4">
          {/* Title + price */}
          <View className="gap-1.5">
            <Text variant="overline" className="text-muted">RESEY</Text>
            <Text variant="h2">{product.title}</Text>
            <View className="flex-row items-center gap-3">
              <Text variant="h2" className="font-bold text-primary">{formatVnd(displayPrice)}</Text>
              {product.sale_price && product.sale_price < product.price ? (
                <Text variant="small" className="text-muted line-through">{formatVnd(product.price)}</Text>
              ) : null}
            </View>
            <View className="flex-row">
              <Badge
                label={inStock ? (stock <= 5 ? `Only ${stock} left` : "In stock") : "Out of stock"}
                variant={inStock ? (stock <= 5 ? "warning" : "success") : "danger"}
              />
            </View>
          </View>

          {/* Sizes */}
          {sizes.length > 0 ? (
            <View className="gap-2">
              <Text variant="overline" className="text-muted">Size</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={sizes}
                keyExtractor={(s) => s}
                contentContainerClassName="gap-2"
                renderItem={({ item: size }) => {
                  const variantForSize = product.variants?.find((v) => v.size === size && v.is_active);
                  const outOfStock = variantForSize ? variantForSize.stock === 0 : false;
                  return (
                    <Chip
                      active={selectedSize === size}
                      disabled={outOfStock}
                      label={size}
                      onPress={() => setSelectedSize(selectedSize === size ? null : size)}
                    />
                  );
                }}
              />
            </View>
          ) : null}

          {/* Colors */}
          {colors.length > 0 ? (
            <View className="gap-2">
              <Text variant="overline" className="text-muted">Color</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={colors}
                keyExtractor={(c) => c}
                contentContainerClassName="gap-2"
                renderItem={({ item: color }) => (
                  <Chip
                    active={selectedColor === color}
                    label={color}
                    onPress={() => setSelectedColor(selectedColor === color ? null : color)}
                  />
                )}
              />
            </View>
          ) : null}

          {/* Quantity */}
          <View className="gap-2">
            <Text variant="overline" className="text-muted">Quantity</Text>
            <View className="flex-row items-center self-start border border-border">
              <Pressable
                onPress={() => setQty(Math.max(1, qty - 1))}
                className="h-10 w-10 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
              >
                <Feather name="minus" size={16} color={tokens.color.text} />
              </Pressable>
              <Text className="w-10 text-center font-semibold">{qty}</Text>
              <Pressable
                onPress={() => setQty(qty + 1)}
                className="h-10 w-10 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
              >
                <Feather name="plus" size={16} color={tokens.color.text} />
              </Pressable>
            </View>
          </View>

          {/* Description */}
          {product.description ? (
            <View className="gap-1.5">
              <Text variant="overline" className="text-muted">Description</Text>
              <Text variant="small" className="leading-5 text-muted">{product.description}</Text>
            </View>
          ) : null}
          {product.material ? (
            <View className="gap-1.5">
              <Text variant="overline" className="text-muted">Material</Text>
              <Text variant="small" className="text-muted">{product.material}</Text>
            </View>
          ) : null}

          {/* Reviews */}
          {reviews && reviews.length > 0 ? (
            <View className="gap-2">
              <Text variant="overline" className="text-muted">Reviews ({reviews.length})</Text>
              {reviews.slice(0, 3).map((r) => (
                <View key={r.id} className="gap-1 bg-surface p-3">
                  <Text variant="caption" className="font-semibold text-warning">
                    {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                  </Text>
                  {r.comment ? <Text variant="caption" className="text-muted">{r.comment}</Text> : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        className="flex-row items-center gap-4 border-t border-border bg-bg px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <View>
          <Text variant="caption" className="text-muted">Total</Text>
          <Text className="font-bold text-text">{formatVnd(displayPrice * qty)}</Text>
        </View>
        <View className="flex-1">
          <Button
            title={inStock ? "Add to cart" : "Out of stock"}
            loading={addToCart.isPending}
            disabled={!inStock}
            onPress={handleAddToCart}
          />
        </View>
      </View>
    </View>
  );
}
