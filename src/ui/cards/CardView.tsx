import { Image, StyleSheet, View } from 'react-native';

import { CARDS } from '@/game/data/cards';
import { evolutionTier } from '@/game/data/evolutions';
import type { CardId } from '@/game/types';
import { pt } from '@/i18n/pt';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { colors } from '@/ui/theme';

/** Retratos das cartas (gerados por scripts/art/portraits.mjs). */
export const CARD_ART: Record<CardId, number> = {
  sniper: require('@/assets/images/cards/sniper.png'),
  sheriff: require('@/assets/images/cards/sheriff.png'),
  shotgun: require('@/assets/images/cards/shotgun.png'),
  chainsaw: require('@/assets/images/cards/chainsaw.png'),
  dog: require('@/assets/images/cards/dog.png'),
  barricade: require('@/assets/images/cards/barricade.png'),
  grenade: require('@/assets/images/cards/grenade.png'),
  medkit: require('@/assets/images/cards/medkit.png'),
  molotov: require('@/assets/images/cards/molotov.png'),
  airstrike: require('@/assets/images/cards/airstrike.png'),
  soldier: require('@/assets/images/cards/soldier.png'),
  firefighter: require('@/assets/images/cards/firefighter.png'),
  medic: require('@/assets/images/cards/medic.png'),
  crossbow: require('@/assets/images/cards/crossbow.png'),
  turret: require('@/assets/images/cards/turret.png'),
  landmine: require('@/assets/images/cards/landmine.png'),
  drone: require('@/assets/images/cards/drone.png'),
  tesla: require('@/assets/images/cards/tesla.png'),
  laser: require('@/assets/images/cards/laser.png'),
  titan: require('@/assets/images/cards/titan.png'),
  cryo: require('@/assets/images/cards/cryo.png'),
  forcefield: require('@/assets/images/cards/forcefield.png'),
  blackhole: require('@/assets/images/cards/blackhole.png'),
  orbital: require('@/assets/images/cards/orbital.png'),
};

const FRAMES = ['#ffd96a', '#6ab8ff', '#c08aff'];
const FRAME_EDGES = ['#9a6a1a', '#1f5a9a', '#5a2a9a'];

interface Props {
  card: CardId;
  width: number;
  level?: number;
  dimmed?: boolean;
  selected?: boolean;
  locked?: string | null;
  hideName?: boolean;
  /** Seta verde: dá para subir de nível com o dinheiro atual. */
  upgradable?: boolean;
}

export function CardArt({ card, size }: { card: CardId; size: number }) {
  return <Image source={CARD_ART[card]} style={{ width: size, height: size }} />;
}

/**
 * Carta estilo Clash: moldura dourada em relevo (verde-limão se escolhida), fundo azul (tropa)
 * ou laranja (arma especial) com luz atrás do retrato, gota de custo saindo do canto, nível e
 * faixa com o nome.
 */
export function CardView({ card, width, level, dimmed, selected, locked, hideName, upgradable }: Props) {
  const def = CARDS[card];
  const height = Math.round(width * (hideName ? 1.12 : 1.32));
  const drop = Math.max(22, Math.round(width * 0.42));
  const pad = Math.max(3, Math.round(width * 0.045));
  // Moldura pela evolução: dourada, azul (nível 10) ou roxa (nível 20)
  const tier = level === undefined ? 0 : evolutionTier(level);
  return (
    <View style={[styles.frame, { width, height, padding: pad, borderRadius: width * 0.18, backgroundColor: FRAMES[tier] }, selected && styles.selected]}>
      <View style={[styles.inner, { borderRadius: width * 0.13, borderColor: FRAME_EDGES[tier], backgroundColor: def.kind === 'troop' ? '#2f6aa8' : '#b8502a' }]}>
        <View style={styles.glow} />
        <CardArt card={card} size={width * 0.94} />
        {!hideName && (
          <View style={styles.ribbon}>
            <AppText variant="label" numberOfLines={1} adjustsFontSizeToFit style={[styles.name, { fontSize: Math.max(10, width * 0.15), lineHeight: Math.max(12, width * 0.19) }]}>
              {def.name}
            </AppText>
          </View>
        )}
        {dimmed && <View style={styles.dim} />}
        {locked && (
          <View style={styles.lockOverlay}>
            <Image source={ICONS.lock} style={styles.lockIcon} />
            <AppText variant="label" style={styles.lockText}>
              {locked}
            </AppText>
          </View>
        )}
      </View>
      <View style={[styles.cost, { width: drop, height: drop, left: -drop * 0.28, top: -drop * 0.28 }]}>
        <Image source={ICONS.blood} style={{ width: drop, height: drop }} />
        <AppText variant="number" style={[styles.costText, { fontSize: drop * 0.46, lineHeight: drop * 0.56, top: drop * 0.3 }]}>
          {`${def.cost}`}
        </AppText>
      </View>
      {upgradable && !locked && (
        <Image
          source={ICONS.up}
          accessibilityLabel={pt.cards.canUpgrade}
          style={[styles.up, { width: drop * 0.62, height: drop * 0.62, right: -drop * 0.3, bottom: -drop * 0.26 }]}
        />
      )}
      {level !== undefined && (
        <AppText variant="number" color="#ffe27a" style={[styles.level, { fontSize: Math.max(10, width * 0.14), lineHeight: Math.max(12, width * 0.17) }]}>
          {pt.cards.shortLevel(level)}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderWidth: 3, borderColor: colors.outline },
  selected: { backgroundColor: colors.accent },
  inner: { flex: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end', borderWidth: 2 },
  glow: { position: 'absolute', width: '125%', aspectRatio: 1, top: '4%', borderRadius: 999, backgroundColor: 'rgba(255, 255, 255, 0.22)' },
  ribbon: { position: 'absolute', bottom: 3, left: -3, right: -3, paddingVertical: 1, paddingHorizontal: 6, alignItems: 'center', backgroundColor: 'rgba(23, 20, 27, 0.72)' },
  name: { textAlign: 'center' },
  cost: { position: 'absolute', alignItems: 'center' },
  costText: { position: 'absolute', left: 0, right: 0, textAlign: 'center' },
  level: { position: 'absolute', right: 6, top: 4 },
  up: { position: 'absolute' },
  dim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(22, 20, 26, 0.6)' },
  lockOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(22, 20, 26, 0.7)', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 4 },
  lockIcon: { width: 26, height: 26 },
  lockText: { fontSize: 13, lineHeight: 16, textAlign: 'center' },
});
