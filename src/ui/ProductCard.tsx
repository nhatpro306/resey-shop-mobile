import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { Text } from "./Text";
import { formatVnd } from "@/lib/currency";
import { getResizedImageUrl } from "@/domain/services/storage";
import type { ProductType } from "@/domain/types";

interface ProductCardProps {
  product: ProductType;
  onPress: () => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  const imageUrl = product.image ? getResizedImageUrl(product.image, 400) : null;
  const isOnSale = product.sale_price != null && product.sale_price < product.price;

  return (
    <Pressable
      onPress={onPress}
      className="mb-4 overflow-hidden rounded-lg bg-surface active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={product.title}
    >
      <Image
        source={imageUrl ?? require("../../assets/icon.png")}
        style={{ width: "100%", aspectRatio: 1 }}
        contentFit="cover"
        cachePolicy="memory-disk"
        placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
      />
      <View className="gap-1 p-3">
        <Text variant="small" className="font-semibold text-text" numberOfLines={2}>
          {product.title}
        </Text>
        <View className="flex-row items-center gap-2">
          {isOnSale ? (
            <>
              <Text variant="caption" className="font-bold text-primary">
                {formatVnd(product.sale_price!)}
              </Text>
              <Text variant="caption" className="text-muted line-through">
                {formatVnd(product.price)}
              </Text>
            </>
          ) : (
            <Text variant="caption" className="font-bold text-text">
              {formatVnd(product.price)}
            </Text>
          )}
        </View>
        {product.stock === 0 && (
          <Text variant="caption" className="text-danger">Out of stock</Text>
        )}
      </View>
    </Pressable>
  );
}
