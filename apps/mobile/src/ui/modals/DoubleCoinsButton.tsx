import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { pt } from '@/i18n/pt';
import { useAdStore } from '@/services/ads';
import { canDouble, doubleCoins, doublesLeft } from '@/services/rewards';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { colors } from '@/ui/theme';
import { formatCash } from '@/utils/format';

/** "Assistir e dobrar" no fim da partida (GDD seção 19.4): só aparece com propaganda pronta. */
export function DoubleCoinsButton({ coins }: { coins: number }) {
  const ready = useAdStore((s) => s.ready);
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  if (state === 'done') {
    return (
      <Animated.View entering={ZoomIn.springify().damping(9)}>
        <AppText variant="label" color={colors.yellow}>{`${pt.ads.doubled} +${formatCash(coins)}`}</AppText>
      </Animated.View>
    );
  }
  if (!canDouble(coins, ready)) return null;
  const watch = async () => {
    setState('busy');
    setState((await doubleCoins(coins)) ? 'done' : 'idle');
  };
  return (
    <View style={styles.wrap}>
      <Button label={pt.ads.double(formatCash(coins))} variant="solid" color={colors.tealBright} size="s" disabled={state === 'busy'} onPress={watch} icon={<Image source={ICONS.tv} style={styles.icon} />} />
      <AppText variant="small" color={colors.textMuted}>
        {pt.ads.left(doublesLeft())}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4 },
  icon: { width: 20, height: 20 },
});
