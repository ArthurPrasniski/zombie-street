import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming, ZoomIn } from 'react-native-reanimated';

import { AppText } from '@/ui/kit/AppText';
import { colors } from '@/ui/theme';

const RAYS = 12;

/** Brilho girando atrás de um texto grande que entra pulando ("Nível 11!"). */
export function LevelUpBurst({ label, color = colors.yellow }: { label: string; color?: string }) {
  const spin = useSharedValue(0);
  useEffect(() => {
    spin.set(withRepeat(withTiming(360, { duration: 4000, easing: Easing.linear }), -1));
  }, [spin]);
  const rays = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.get()}deg` }] }));
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.View style={[styles.rays, rays]}>
        {Array.from({ length: RAYS }, (_, i) => (
          <View key={i} style={[styles.ray, { backgroundColor: color, transform: [{ rotate: `${(i * 360) / RAYS}deg` }] }]} />
        ))}
      </Animated.View>
      <Animated.View entering={ZoomIn.springify().damping(9)}>
        <AppText variant="display" color={color} style={styles.label}>
          {label}
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10, 9, 12, 0.55)', zIndex: 30 },
  rays: { position: 'absolute', width: 320, height: 320, alignItems: 'center', justifyContent: 'center' },
  ray: { position: 'absolute', width: 18, height: 320, borderRadius: 9, opacity: 0.18 },
  label: { fontSize: 48, lineHeight: 54 },
});
