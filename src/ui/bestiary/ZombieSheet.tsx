import { Image, StyleSheet, View } from 'react-native';

import { ZOMBIES } from '@/game/data/zombies';
import type { ZombieId } from '@/game/types';
import { pt } from '@/i18n/pt';
import { ZOMBIE_ART, zombieWhere } from '@/ui/bestiary/zombieInfo';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { GameModal } from '@/ui/modals/GameModal';
import { colors, radius } from '@/ui/theme';
import { formatInt } from '@/utils/format';

/** Ficha do zumbi no Bestiário: retrato, onde aparece, mecânica, atributos na fase 1 e abates. */
export function ZombieSheet({ zombie, kills, onClose }: { zombie: ZombieId; kills: number; onClose: () => void }) {
  const def = ZOMBIES[zombie];
  const b = pt.bestiary;
  const stats: [string, number][] = [
    [b.hp, def.hp],
    [b.damage, def.damage],
    [b.speed, def.speed],
  ];
  return (
    <GameModal title={def.name} eyebrow={zombieWhere(zombie)} accent={def.isBoss ? colors.danger : colors.accent} buttons={<Button label={b.close} variant="dark" onPress={onClose} />}>
      <Image source={ZOMBIE_ART[zombie]} style={styles.art} />
      <AppText color={colors.textMuted} style={styles.center}>
        {b.descriptions[zombie]}
      </AppText>
      <AppText variant="label" color={colors.yellow} style={styles.center}>
        {b.abilities[zombie]}
      </AppText>
      <View style={styles.stats}>
        {stats.map(([label, value]) => (
          <View key={label} style={styles.stat}>
            <AppText variant="small" color={colors.textMuted}>
              {label}
            </AppText>
            <AppText variant="number">{formatInt(value)}</AppText>
          </View>
        ))}
      </View>
      <AppText variant="small" color={colors.textMuted}>
        {b.atStage1}
      </AppText>
      <AppText variant="label" color={colors.accent}>
        {b.kills(formatInt(kills))}
      </AppText>
    </GameModal>
  );
}

const styles = StyleSheet.create({
  art: { width: 132, height: 132 },
  center: { textAlign: 'center' },
  stats: { flexDirection: 'row', alignSelf: 'stretch', borderRadius: radius.m, backgroundColor: colors.background, paddingVertical: 8 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
});
