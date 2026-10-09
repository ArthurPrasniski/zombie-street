import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { rewardHaptic } from '@/audio/sfx';

import { type AchievementDef, MEDALS } from '@/game/data/achievements';
import { pt } from '@/i18n/pt';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { Chunky } from '@/ui/kit/Chunky';
import { CoinBurst } from '@/ui/fx/CoinBurst';
import { Pop } from '@/ui/fx/Pop';
import { colors, radius } from '@/ui/theme';
import { formatCash, formatInt } from '@/utils/format';

const MEDAL_COLORS = ['#d8884a', '#c8d0e0', '#ffc93c'];

interface Props {
  def: AchievementDef;
  value: number;
  reached: number;
  /** Prêmio do próximo marco a resgatar, ou null. */
  reward: number | null;
  goal: number;
  onClaim: () => void;
}

/** Uma conquista: 3 medalhas, a meta atual com barra e o botão de resgatar. */
export function AchievementRow({ def, value, reached, reward, goal, onClaim }: Props) {
  const complete = reached >= MEDALS;
  // Cada resgate monta uma chuva de moedas nova (a key muda)
  const [bursts, setBursts] = useState(0);
  const claim = () => {
    onClaim();
    setBursts((n) => n + 1);
    rewardHaptic(true);
  };
  const ratio = complete ? 1 : Math.min(1, value / goal);
  return (
    <Chunky face={reward !== null ? '#3a3448' : colors.surfaceHigh} edge="#16131a" radius={radius.m} depth={5} gloss={0.05} faceStyle={styles.row}>
      <Pop trigger={reached} style={styles.medals}>
        {MEDAL_COLORS.map((color, i) => (
          <View key={color} style={[styles.medal, { backgroundColor: i < reached ? color : 'rgba(0, 0, 0, 0.35)' }]} accessibilityLabel={pt.achievements.medals[i]} />
        ))}
      </Pop>
      <View style={styles.texts}>
        <AppText variant="label">{def.name}</AppText>
        <AppText variant="small" color={colors.textMuted}>
          {pt.achievements.goals[def.id](formatInt(goal))}
        </AppText>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${ratio * 100}%` }, complete && styles.fillDone]} />
        </View>
        <AppText variant="small" color={colors.textMuted}>
          {complete ? pt.achievements.done : pt.achievements.progress(formatInt(Math.min(value, goal)), formatInt(goal))}
        </AppText>
      </View>
      <View>
        {reward !== null && <Button label={formatCash(reward)} size="s" onPress={claim} icon={<Image source={ICONS.coin} style={styles.coin} />} />}
        {bursts > 0 && <CoinBurst key={bursts} />}
      </View>
    </Chunky>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  medals: { gap: 4 },
  medal: { width: 16, height: 16, borderRadius: 8, borderWidth: 2.5, borderColor: colors.outline },
  texts: { flex: 1, gap: 3 },
  track: { height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: colors.outline, backgroundColor: 'rgba(0, 0, 0, 0.35)', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.accent },
  fillDone: { backgroundColor: colors.gold },
  coin: { width: 18, height: 18 },
});
