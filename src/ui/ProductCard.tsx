import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import Feather from "@expo/vector-icons/Feather";
import { Text } from "./Text";
import { Price } from "./Price";
import { Stars } from "./Stars";
import { getResizedImageUrl } from "@/lib/imageUrl";
import { useThemeColors } from "@/config/theme";
import type { ProductType } from "@/domain/types";

interface ProductCardProps {
  product: ProductType & { rating?: number; badge?: string | null };
  onPress: () => void;
  saved?: boolean;
  onToggleSave?: (id: string) => void;
}

function Pill({ label, tone }: { label: string; tone: "accent" | "ink" }) {
  return (
    <View className={tone === "accent" ? "bg-accent px-[7px] py-[3px]" : "bg-ink px-[7px] py-[3px]"}>
      <Text className={tone === "accent" ? "text-[10px] font-extrabold uppercase tracking-[0.1em] text-accent-fg" : "text-[10px] font-extrabold uppercase tracking-[0.1em] text-ink-fg"}>
        {label}
      </Text>
    </View>
  );
}

export function ProductCard({ product, onPress, saved, onToggleSave }: ProductCardProps) {
  const c = useThemeColors();
  const imageUrl = product.image ? getResizedImageUrl(product.image, 400) : null;
  const onSale = product.sale_price != null && product.sale_price < product.price;
  const isSoldOut = product.stock === 0;
  const low = !isSoldOut && product.stock <= 12;
  const discount = onSale ? Math.round((1 - product.sale_price! / product.price) * 100) : 0;
  const badge = product.badge;

  return (
    <Pressable onPress={onPress} className="active:opacity-80" accessibilityRole="button" accessibilityLabel={product.title}>
      <View className="relative w-full overflow-hidden bg-img-bg" style={{ aspectRatio: 3 / 4 }}>
        <Image
          source={imageUrl ?? require("../../assets/icon.png")}
          style={{ width: "100%", height: "100%", opacity: isSoldOut ? 0.7 : 1 }}
          contentFit="cover"
          cachePolicy="memory-disk"
          placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
        />

        {/* top-left badges */}
        <View className="absolute left-2 top-2 gap-1.5">
          {onSale ? <Pill label={`-${discount}%`} tone="accent" /> : null}
          {!onSale && badge === "new" ? <Pill label="NEW" tone="ink" /> : null}
          {!onSale && badge === "hot" ? <Pill label="HOT" tone="ink" /> : null}
        </View>

        {/* wishlist */}
        {onToggleSave ? (
          <Pressable
            onPress={(e) => { e.stopPropagation(); onToggleSave(product.product_id); }}
            hitSlop={8}
            className="absolute right-[7px] top-[7px] h-[34px] w-[34px] items-center justify-center rounded-full bg-white/80"
            accessibilityRole="button"
            accessibilityLabel="Lưu sản phẩm"
          >
            <Feather name="heart" size={17} color={saved ? c.accent : "#1a1a1a"} />
          </Pressable>
        ) : null}

        {/* sold out overlay */}
        {isSoldOut ? (
          <View className="absolute inset-0 items-center justify-center">
            <View className="bg-black/80 px-3 py-1.5">
              <Text className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white">Hết hàng</Text>
            </View>
          </View>
        ) : null}

        {/* low stock ribbon */}
        {low ? (
          <View className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-[5px]">
            <Text className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-white">Chỉ còn {product.stock}</Text>
          </View>
        ) : null}
      </View>

      <View className="gap-1.5 pt-2.5">
        <Text variant="cardtitle" numberOfLines={2}>{product.title}</Text>
        <View className="flex-row items-center justify-between">
          <Price price={product.price} sale={product.sale_price} size="sm" />
          {product.rating != null ? <Stars rating={product.rating} size={10} /> : null}
        </View>
      </View>
    </Pressable>
  );
}
