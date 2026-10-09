import { Image, StyleSheet, View } from 'react-native';

import { rewardHaptic } from '@/audio/sfx';

import { baseStats, TRUCK_PARTS, type TruckLevels, type TruckPart } from '@/game/data/truck';
import { pt } from '@/i18n/pt';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { Chunky } from '@/ui/kit/Chunky';
import { Segments } from '@/ui/kit/Pill';
import { Pop } from '@/ui/fx/Pop';
import { colors, radius } from '@/ui/theme';
import { formatCash, formatInt } from '@/utils/format';

const PART_ICONS: Record<TruckPart, number> = { hull: ICONS.shield, gun: ICONS.bullet, tank: ICONS.blood };

/** Valor que a peça mexe, como texto (dano com uma casa decimal). */
export function statText(part: TruckPart, levels: TruckLevels): string {
  const stats = baseStats(levels);
  if (part === 'hull') return formatInt(stats.hp);
  if (part === 'gun') return stats.damage.toFixed(1).replace('.', ',');
  return `${stats.startBlood}`;
}

interface Props {
  part: TruckPart;
  levels: TruckLevels;
  /** Custo do próximo nível, ou null no máximo. */
  cost: number | null;
  affordable: boolean;
  onUpgrade: () => void;
}

/** Uma peça da Oficina: ícone, nível, o efeito antes › depois e o botão com o custo. */
export function PartRow({ part, levels, cost, affordable, onUpgrade }: Props) {
  const def = TRUCK_PARTS[part];
  const level = levels[part];
  const label = pt.garage.stats[part];
  const now = statText(part, levels);
  const effect = cost === null ? pt.garage.value(label, now) : pt.garage.change(label, now, statText(part, { ...levels, [part]: level + 1 }));
  const segments = Math.min(def.maxLevel, 10);
  return (
    <Chunky face={colors.surfaceHigh} edge="#16131a" radius={radius.m} depth={5} gloss={0.05} faceStyle={styles.row}>
      <Image source={PART_ICONS[part]} style={styles.icon} />
      <View style={styles.texts}>
        <View style={styles.title}>
          <AppText variant="label">{def.name}</AppText>
          <Pop trigger={level}>
            <AppText variant="small" color={colors.accent}>
              {pt.garage.level(level, def.maxLevel)}
            </AppText>
          </Pop>
        </View>
        <Segments total={segments} filled={Math.round((level / def.maxLevel) * segments)} height={4} />
        <AppText variant="small" color={colors.text}>
          {effect}
        </AppText>
        <AppText variant="small" color={colors.textMuted}>
          {pt.garage.hints[part]}
        </AppText>
      </View>
      {cost === null ? (
        <AppText variant="label" color={colors.accent}>
          {pt.garage.max.toUpperCase()}
        </AppText>
      ) : (
        <Button
          label={formatCash(cost)}
          size="s"
          disabled={!affordable}
          onPress={() => {
            onUpgrade();
            rewardHaptic();
          }}
          icon={<Image source={ICONS.coin} style={styles.coin} />}
        />
      )}
    </Chunky>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  icon: { width: 46, height: 46 },
  texts: { flex: 1, gap: 4 },
  title: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  coin: { width: 18, height: 18 },
});
