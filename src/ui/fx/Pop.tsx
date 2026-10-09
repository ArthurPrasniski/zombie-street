import { type ReactNode, useEffect, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

/** Dá um pulinho (cresce e volta com mola) sempre que `trigger` muda; na primeira vez, nada. */
export function Pop({ trigger, children, style, scale = 1.35 }: { trigger: unknown; children: ReactNode; style?: StyleProp<ViewStyle>; scale?: number }) {
  const size = useSharedValue(1);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    size.set(withSequence(withTiming(scale, { duration: 110 }), withSpring(1, { damping: 7, stiffness: 220 })));
  }, [trigger, scale, size]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: size.get() }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
