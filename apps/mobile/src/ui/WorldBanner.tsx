import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';

import { MAX_STARS } from '@/game/data/balance';
import { isFrontier, STAGES_PER_WORLD, worldDef } from '@/game/data/worlds';
import type { WorldId } from '@/game/types';
import { pt } from '@/i18n/pt';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { IconButton, Segments } from '@/ui/kit/Pill';
import { colors, radius } from '@/ui/theme';
import { worldDetails, worldName, worldTint } from '@/ui/worldInfo';

const SCENES: Record<WorldId, number> = {
  farm: require('@/assets/images/worlds/farm.png'),
  city: require('@/assets/images/worlds/city.png'),
  swamp: require('@/assets/images/worlds/swamp.png'),
  desert: require('@/assets/images/worlds/desert.png'),
  snow: require('@/assets/images/worlds/snow.png'),
  tech: require('@/assets/images/worlds/tech.png'),
  lab: require('@/assets/images/worlds/lab.png'),
  launch: require('@/assets/images/worlds/launch.png'),
  station: require('@/assets/images/worlds/station.png'),
  moon: require('@/assets/images/worlds/moon.png'),
  mars: require('@/assets/images/worlds/mars.png'),
  hive: require('@/assets/images/worlds/hive.png'),
};
const BANNER_H = 150;

/** Nomes longos (planetas da Fronteira) com fonte menor, para caber entre as setas. */
const nameSize = (name: string) => (name.length > 22 ? { fontSize: 19, lineHeight: 23 } : name.length > 16 ? { fontSize: 23, lineHeight: 27 } : null);
const SCENE_RATIO = 900 / 600;

interface Props {
  world: number;
  cleared: number;
  /** Estrelas somadas das fases do mundo. */
  stars: number;
  /** Rótulo da fase que libera o mundo, ou null se já está liberado. */
  lockedBy: string | null;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
}

/** Faixa do mundo: o topo do cenário, nome, fases vencidas, estrelas e setas para trocar de mundo. */
export function WorldBanner({ world, cleared, stars, lockedBy, onPrev, onNext }: Props) {
  const { width } = useWindowDimensions();
  const def = worldDef(world);
  const sceneW = width - 32;
  const tint = worldTint(world);
  const details = worldDetails(world);
  return (
    <View style={styles.banner}>
      <Image source={SCENES[def.id]} style={{ width: sceneW, height: sceneW * SCENE_RATIO }} />
      {tint && <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />}
      <View style={[StyleSheet.absoluteFill, styles.veil, lockedBy && styles.lockedVeil]} />
      <View style={styles.content}>
        <View style={styles.arrow}>{onPrev && <IconButton icon={ICONS.back} label={pt.common.back} onPress={onPrev} size={40} />}</View>
        <View style={styles.texts}>
          <AppText variant="eyebrow">{isFrontier(world) ? pt.frontier.eyebrow(world + 1) : pt.stages.world(world + 1)}</AppText>
          <AppText variant="title" numberOfLines={1} style={[styles.name, nameSize(worldName(world))]}>
            {worldName(world)}
          </AppText>
          {details && (
            <AppText variant="small" color={colors.yellow} numberOfLines={1} adjustsFontSizeToFit>
              {details}
            </AppText>
          )}
          {lockedBy ? (
            <View style={styles.locked}>
              <Image source={ICONS.lock} style={styles.lockIcon} />
              <AppText variant="small">{pt.stages.worldLocked(lockedBy)}</AppText>
            </View>
          ) : (
            <View style={styles.progress}>
              <Segments total={STAGES_PER_WORLD} filled={cleared} height={5} />
              <View style={styles.counts}>
                <AppText variant="small" color={colors.textMuted}>
                  {pt.stages.worldProgress(cleared, STAGES_PER_WORLD)}
                </AppText>
                <Image source={ICONS.star} style={styles.starIcon} />
                <AppText variant="small" color={colors.yellow}>
                  {pt.stages.worldStars(stars, STAGES_PER_WORLD * MAX_STARS)}
                </AppText>
              </View>
            </View>
          )}
        </View>
        <View style={styles.arrow}>{onNext && <IconButton icon={ICONS.next} label={pt.stages.world(world + 2)} onPress={onNext} size={40} />}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { height: BANNER_H, borderRadius: radius.l, overflow: 'hidden', borderWidth: 3, borderColor: colors.outline },
  veil: { backgroundColor: 'rgba(22, 20, 26, 0.45)' },
  lockedVeil: { backgroundColor: 'rgba(22, 20, 26, 0.78)' },
  content: { ...StyleSheet.absoluteFill, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  arrow: { width: 44, alignItems: 'center' },
  texts: { flex: 1, minWidth: 0, alignItems: 'center', gap: 4 },
  name: { textAlign: 'center', alignSelf: 'stretch' },
  progress: { alignSelf: 'stretch', gap: 4, alignItems: 'center', paddingHorizontal: 14 },
  locked: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lockIcon: { width: 16, height: 16 },
  counts: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  starIcon: { width: 16, height: 16, marginLeft: 6 },
});
