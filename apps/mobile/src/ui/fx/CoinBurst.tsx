import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { ICONS } from '@/ui/icons';

const COINS = 8;
const DURATION = 750;

function Coin({ index }: { index: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withDelay(index * 35, withTiming(1, { duration: DURATION, easing: Easing.out(Easing.quad) })));
  }, [index, t]);
  // Cada moeda sai num ângulo, sobe e cai um pouco (arco) e some no fim
  const angle = -Math.PI / 2 + ((index / (COINS - 1)) - 0.5) * 2.2;
  const style = useAnimatedStyle(() => {
    const p = t.get();
    return {
      opacity: p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3,
      transform: [{ translateX: Math.cos(angle) * 70 * p }, { translateY: Math.sin(angle) * 80 * p + 90 * p * p }, { scale: 0.6 + 0.5 * (1 - p) }],
    };
  });
  return (
    <Animated.View style={[styles.coin, style]}>
      <Image source={ICONS.coin} style={styles.icon} />
    </Animated.View>
  );
}

/** Moedas saltando de um ponto (resgate de prêmio). Monte com uma `key` nova para tocar de novo. */
export function CoinBurst() {
  return (
    <View style={styles.wrap} pointerEvents="none">
      {Array.from({ length: COINS }, (_, i) => (
        <Coin key={i} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: '50%', left: '50%', width: 0, height: 0, zIndex: 20 },
  coin: { position: 'absolute', left: -12, top: -12 },
  icon: { width: 24, height: 24 },
});
