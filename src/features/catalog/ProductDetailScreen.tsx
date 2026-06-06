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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import Feather from "@expo/vector-icons/Feather";
import { useProduct, useProducts } from "./hooks";
import { useWishlist } from "@/features/saved/hooks";
import { useAddToCart } from "@/features/cart/hooks";
import { useReviews } from "@/features/account/hooks";
import { useAuth } from "@/features/auth/AuthContext";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import { Skeleton } from "@/ui/Skeleton";
import { Price } from "@/ui/Price";
import { Stars } from "@/ui/Stars";
import { Swatch } from "@/ui/Swatch";
import { Accordion } from "@/ui/Accordion";
import { SectionHeader } from "@/ui/SectionHeader";
import { ProductCard } from "@/ui/ProductCard";
import { Sheet } from "@/ui/Sheet";
import { formatVnd } from "@/lib/currency";
import { getResizedImageUrl } from "@/lib/imageUrl";
import { useThemeColors } from "@/config/theme";
import { cn } from "@/lib/cn";
import type { ProductVariantType, ProductType } from "@/domain/types";
import type { AppError } from "@/domain/errors";
import { track } from "@/lib/analytics";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");
const SIZE_TABLE = [
  { s: "S", chest: "50", len: "66", kg: "45–55" },
  { s: "M", chest: "53", len: "69", kg: "55–65" },
  { s: "L", chest: "56", len: "72", kg: "65–75" },
  { s: "XL", chest: "59", len: "74", kg: "75–85" },
];

export function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const { data: product, isLoading, isError, refetch } = useProduct(slug ?? "");
  const { user } = useAuth();
  const wishlist = useWishlist(user?.id ?? null);
  const addToCart = useAddToCart(user?.id ?? null);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [sizeGuide, setSizeGuide] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const { data: reviews } = useReviews(product?.product_id ?? "");
  const { data: relatedPages } = useProducts(
    product?.category_id != null ? { categoryId: product.category_id } : {},
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg">
        <Skeleton className="w-full" style={{ height: width }} />
        <View className="gap-3 px-4 pt-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </View>
      </View>
    );
  }

  if (isError || !product) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-bg px-8">
        <Text variant="body">Không tải được sản phẩm.</Text>
        <Button title="Thử lại" variant="outline" size="md" onPress={() => refetch()} />
        <Button title="Quay lại" variant="ghost" size="md" onPress={() => router.back()} />
      </View>
    );
  }

  const variants = (product.variants ?? []).filter((v) => v.is_active);
  const colors = product.colors ?? [...new Set(variants.map((v) => v.color).filter(Boolean) as string[])];
  const sizes = product.sizes ?? [...new Set(variants.map((v) => v.size).filter(Boolean) as string[])];
  const activeColor = selectedColor ?? colors[0] ?? null;

  const images: string[] = product.images?.length
    ? [...product.images].sort((a, b) => a.sort_order - b.sort_order).map((i) => i.url)
    : product.image
    ? [product.image]
    : [];

  function sizeStock(s: string) {
    const vs = variants.filter((v) => v.size === s && (!activeColor || v.color === activeColor));
    if (vs.length === 0) return product?.stock ?? 0;
    return vs.reduce((a, v) => a + (v.stock ?? 0), 0);
  }

  const selectedVariant: ProductVariantType | undefined = variants.find(
    (v) => (selectedSize ? v.size === selectedSize : true) && (activeColor ? v.color === activeColor : true),
  );
  const displayPrice = selectedVariant?.price_override ?? product.sale_price ?? product.price;
  const stock = selectedVariant?.stock ?? product.stock ?? 0;
  const inStock = stock > 0;
  const rating = (product as { rating?: number }).rating;
  const related = ((relatedPages?.pages.flatMap((p) => p.items) ?? []) as ProductType[])
    .filter((x) => x.product_id !== product.product_id)
    .slice(0, 4);

  function onGalleryScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setGalleryIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  }

  async function handleAdd() {
    if (!user) { router.push("/(auth)/login"); return; }
    if (!product) return;
    if (!inStock) return;
    if (sizes.length > 0 && !selectedSize) { setSizeError(true); Alert.alert("Vui lòng chọn kích cỡ"); return; }
    try {
      await addToCart.mutateAsync({
        productId: product.product_id,
        price: displayPrice,
        quantity: qty,
        opts: {
          variantId: selectedVariant ? Number(selectedVariant.id) : undefined,
          size: selectedSize ?? undefined,
          color: activeColor ?? undefined,
        },
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      track("add_to_cart", { productId: product.product_id, quantity: qty });
      Alert.alert("Đã thêm vào giỏ", product.title);
    } catch (e) {
      Alert.alert("Lỗi", (e as AppError).message);
    }
  }

  return (
    <View className="flex-1 bg-bg">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* GALLERY */}
        <View>
          <FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={images}
            keyExtractor={(u, i) => `${u}-${i}`}
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
          {/* top controls */}
          <View style={{ top: insets.top + 8 }} className="absolute inset-x-3 flex-row justify-between">
            <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-full bg-white/80" accessibilityRole="button" accessibilityLabel="Quay lại">
              <Feather name="chevron-left" size={22} color="#111" />
            </Pressable>
            <View className="flex-row gap-2">
              <Pressable onPress={() => Alert.alert("Đã sao chép liên kết")} className="h-11 w-11 items-center justify-center rounded-full bg-white/80" accessibilityRole="button" accessibilityLabel="Chia sẻ">
                <Feather name="share-2" size={18} color="#111" />
              </Pressable>
              {user ? (
                <Pressable onPress={() => wishlist.toggle(product.product_id)} className="h-11 w-11 items-center justify-center rounded-full bg-white/80" accessibilityRole="button" accessibilityLabel="Lưu sản phẩm">
                  <Feather name="heart" size={19} color={wishlist.has(product.product_id) ? c.accent : "#111"} />
                </Pressable>
              ) : null}
            </View>
          </View>
          {/* dots */}
          {images.length > 1 ? (
            <View className="absolute bottom-3.5 w-full flex-row justify-center gap-1.5">
              {images.map((u, i) => (
                <View key={`${u}-${i}`} className={cn("h-1.5", i === galleryIndex ? "w-[18px] bg-white" : "w-1.5 bg-white/55")} />
              ))}
            </View>
          ) : null}
        </View>

        {/* INFO */}
        <View className="px-4 pt-5">
          <Text variant="eyebrow">RESEY</Text>
          <Text variant="h1" className="mt-2.5 text-2xl">{product.title}</Text>
          <View className="mt-3 flex-row items-center gap-2.5">
            <Price price={product.price} sale={product.sale_price} size="lg" />
          </View>
          <View className="mt-3 flex-row items-center gap-2.5">
            {rating != null ? <Stars rating={rating} size={13} showNum count={reviews?.length} /> : null}
            {inStock ? (
              <View className="flex-row items-center gap-1.5">
                <View className="h-1.5 w-1.5 rounded-full bg-ok" />
                <Text className="text-xs font-bold uppercase tracking-[0.06em] text-ok">Còn hàng</Text>
              </View>
            ) : (
              <Text className="text-xs font-bold uppercase tracking-[0.08em] text-fg-faint">Hết hàng</Text>
            )}
          </View>

          {/* COLOR */}
          {colors.length > 0 ? (
            <View className="mt-6">
              <View className="flex-row items-center justify-between">
                <Text variant="eyebrow">Màu sắc</Text>
                <Text className="text-xs font-semibold text-fg-muted">{activeColor}</Text>
              </View>
              <View className="mt-3 flex-row gap-2">
                {colors.map((col) => (
                  <Swatch key={col} name={col} active={activeColor === col} onPress={() => { setSelectedColor(col); setSelectedSize(null); }} />
                ))}
              </View>
            </View>
          ) : null}

          {/* SIZE */}
          {sizes.length > 0 ? (
            <View className="mt-6">
              <View className="flex-row items-center justify-between">
                <Text variant="eyebrow" className={sizeError ? "text-accent" : undefined}>Kích cỡ</Text>
                <Pressable onPress={() => setSizeGuide(true)} className="flex-row items-center gap-1.5" accessibilityRole="button">
                  <Feather name="maximize-2" size={13} color={c.fg} />
                  <Text className="text-[11px] font-bold uppercase tracking-[0.1em] text-fg">Bảng size</Text>
                </Pressable>
              </View>
              <View className="mt-3 flex-row flex-wrap gap-2">
                {sizes.map((s) => {
                  const out = sizeStock(s) === 0;
                  const on = selectedSize === s;
                  return (
                    <Pressable
                      key={s}
                      disabled={out}
                      onPress={() => { setSelectedSize(s); setSizeError(false); }}
                      className={cn(
                        "h-[46px] min-w-[52px] items-center justify-center border px-3.5",
                        on ? "border-ink bg-ink" : "border-border bg-surface",
                        out && "opacity-50",
                      )}
                      accessibilityRole="button"
                      accessibilityLabel={`Size ${s}`}
                    >
                      <Text className={cn("text-[13px] font-bold", on ? "text-ink-fg" : out ? "text-fg-faint line-through" : "text-fg")}>{s}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {sizeError ? <Text className="mt-2 text-xs text-accent">Vui lòng chọn kích cỡ</Text> : null}
            </View>
          ) : null}

          {/* QTY */}
          <View className="mt-6 flex-row items-center justify-between">
            <Text variant="eyebrow">Số lượng</Text>
            <View className="flex-row items-center border border-border">
              <Pressable onPress={() => setQty((q) => Math.max(1, q - 1))} className="h-11 w-11 items-center justify-center" accessibilityRole="button" accessibilityLabel="Giảm số lượng">
                <Feather name="minus" size={16} color={c.fg} />
              </Pressable>
              <Text className="w-10 text-center text-sm font-bold text-fg">{qty}</Text>
              <Pressable onPress={() => setQty((q) => q + 1)} className="h-11 w-11 items-center justify-center" accessibilityRole="button" accessibilityLabel="Tăng số lượng">
                <Feather name="plus" size={16} color={c.fg} />
              </Pressable>
            </View>
          </View>

          {/* ACCORDIONS */}
          <View className="mt-6">
            {product.description ? (
              <Accordion title="Mô tả" defaultOpen>
                <Text variant="body" className="text-[13.5px]">{product.description}</Text>
              </Accordion>
            ) : null}
            <Accordion title="Chi tiết">
              <View className="gap-3">
                {product.material ? <DetailRow label="Chất liệu" value={product.material} /> : null}
                {(product as { fit?: string }).fit ? <DetailRow label="Phom" value={(product as { fit?: string }).fit!} /> : null}
              </View>
            </Accordion>
            {reviews && reviews.length > 0 ? (
              <Accordion title={`Đánh giá (${reviews.length})`}>
                <View className="gap-3">
                  {reviews.slice(0, 3).map((r) => (
                    <View key={r.id} className="border-t border-border pt-3">
                      <Stars rating={r.rating} size={11} />
                      {r.comment ? <Text variant="body" className="mt-1.5 text-[12.5px]">{r.comment}</Text> : null}
                    </View>
                  ))}
                </View>
              </Accordion>
            ) : null}
          </View>
        </View>

        {/* RELATED */}
        {related.length > 0 ? (
          <View className="pt-6">
            <View className="px-4">
              <SectionHeader eyebrow="Tuyển chọn" title="Có thể bạn thích" />
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={related}
              keyExtractor={(x) => x.product_id}
              contentContainerClassName="gap-3 px-4"
              renderItem={({ item }) => (
                <View style={{ width: 150 }}>
                  <ProductCard product={item} onPress={() => router.push(`/product/${item.slug}` as any)} />
                </View>
              )}
            />
          </View>
        ) : null}
      </ScrollView>

      {/* STICKY CTA */}
      <View
        className="absolute inset-x-0 bottom-0 flex-row items-center gap-3.5 border-t border-border bg-bg px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <View>
          <Text className="text-[10px] font-bold uppercase tracking-[0.14em] text-fg-subtle">Tổng</Text>
          <Text className="text-[17px] font-extrabold text-fg">{formatVnd(displayPrice * qty)}</Text>
        </View>
        <View className="flex-1">
          <Button
            title={inStock ? "Thêm vào giỏ" : "Hết hàng"}
            icon={inStock ? "shopping-bag" : "bell"}
            variant={inStock ? "primary" : "soft"}
            full
            loading={addToCart.isPending}
            disabled={!inStock}
            onPress={handleAdd}
          />
        </View>
      </View>

      {/* SIZE GUIDE */}
      <Sheet open={sizeGuide} onClose={() => setSizeGuide(false)} title="Bảng size" maxHeightPct={0.7}>
        <View className="border-b border-border-strong flex-row pb-2.5">
          {["SIZE", "NGỰC", "DÀI", "CÂN NẶNG"].map((h) => (
            <Text key={h} className="flex-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-fg-subtle">{h}</Text>
          ))}
        </View>
        {SIZE_TABLE.map((r) => (
          <View key={r.s} className="flex-row border-b border-border py-3">
            <Text className="flex-1 text-[13px] font-bold text-fg">{r.s}</Text>
            <Text className="flex-1 text-[13px] text-fg-muted">{r.chest}</Text>
            <Text className="flex-1 text-[13px] text-fg-muted">{r.len}</Text>
            <Text className="flex-1 text-[13px] text-fg-muted">{r.kg}</Text>
          </View>
        ))}
        <Text variant="body" className="mt-4 text-xs">Số đo tính bằng cm. Người mẫu mặc size M / L cho phom rộng.</Text>
      </Sheet>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-[13px] text-fg-subtle">{label}</Text>
      <Text className="text-[13px] font-semibold text-fg">{value}</Text>
    </View>
  );
}
