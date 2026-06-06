import { useEffect } from "react";
import { type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useReducedMotion,
} from "react-native-reanimated";
import { cn } from "@/lib/cn";

export function Skeleton({ className, style }: { className?: string; style?: ViewStyle }) {
  const opacity = useSharedValue(0.4);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 0.6;
      return;
    }
    opacity.value = withRepeat(
      withSequence(withTiming(0.85, { duration: 700 }), withTiming(0.4, { duration: 700 })),
      -1,
      false,
    );
  }, [opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View className={cn("bg-surface-sunken", className)} style={[style, animatedStyle]} />;
}
