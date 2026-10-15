import { localizedName } from '@/i18n/names';
import { useProgressStore } from '@/state/progressStore';
import { masteryTier } from '@/game/data/cosmetics';
import { Image, StyleSheet, View } from 'react-native';

import { CARDS } from '@/game/data/cards';
import { evolutionTier } from '@/game/data/evolutions';
import type { CardId } from '@/game/types';
import { t as pt } from '@/i18n';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { colors } from '@/ui/theme';
import {DETAILED_CARD_ART} from '@/ui/pixel16/productionPortraits';

/** Retratos das cartas (arte RPG detalhada). */
export const CARD_ART: Record<CardId, number> = DETAILED_CARD_ART;

const FRAMES = ['#b89a60', '#7297ac', '#aa87ba'];
const FRAME_EDGES = ['#655035', '#364f63', '#594366'];

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
  /** Visual discreto para organizar a coleção; a mão de combate mantém o padrão. */
  quiet?: boolean;
}

export function CardArt({ card, size }: { card: CardId; size: number }) {
  return <Image source={CARD_ART[card]} style={{ width: size, height: size }} />;
}

/**
 * Carta estilo Clash: moldura dourada em relevo (verde-limão se escolhida), fundo azul (tropa)
 * ou laranja (arma especial) com luz atrás do retrato, gota de custo saindo do canto, nível e
 * faixa com o nome.
 */
export function CardView({ card, width, level, dimmed, selected, locked, hideName, upgradable, quiet = false }: Props) {
  const mastery = useProgressStore((s) => masteryTier(s.mastery[card] ?? 0));
  const def = CARDS[card];
  const height = Math.round(width * (hideName ? 1.12 : 1.32));
  const drop = Math.max(22, Math.round(width * (quiet ? 0.31 : 0.42)));
  const pad = Math.max(3, Math.round(width * 0.045));
  // Moldura pela evolução: dourada, azul (nível 10) ou roxa (nível 20)
  const tier = level === undefined ? 0 : evolutionTier(level);
  return (
    <View style={[styles.frame, { width, height, padding: pad, borderRadius: 2, backgroundColor: FRAMES[tier] }, quiet && styles.quietFrame, quiet && tier === 0 ? { backgroundColor: '#746647' } : null, quiet && locked ? styles.quietLocked : null, selected && styles.selected]}>
      <View style={[styles.inner, { borderRadius: 0, borderColor: FRAME_EDGES[tier], backgroundColor: def.kind === 'troop' ? '#303f43' : '#554333' }, mastery > 0 ? { borderColor: ['#8c8067','#d5b581','#75cace','#c695ff'][mastery] } : null]}>
        {!quiet && <View style={styles.glow} />}
        <CardArt card={card} size={width * 0.94} />
        {!hideName && (
          <View style={styles.ribbon}>
            <AppText variant="label" numberOfLines={1} adjustsFontSizeToFit style={[styles.name, { fontSize: Math.max(10, width * 0.15), lineHeight: Math.max(12, width * 0.19) }]}>
              {localizedName(def.name)}
            </AppText>
          </View>
        )}
        {dimmed && <View style={styles.dim} />}
        {locked && (
          <View style={quiet ? styles.quietLockOverlay : styles.lockOverlay}>
            <Image source={ICONS.lock} style={quiet ? styles.quietLockIcon : styles.lockIcon} />
            {!quiet && <AppText variant="label" style={styles.lockText}>
              {locked}
            </AppText>}
          </View>
        )}
      </View>
      {!(quiet && locked) && <View style={[styles.cost, { width: drop, height: drop, left: -drop * 0.28, top: -drop * 0.28 }]}>
        <Image source={ICONS.blood} style={{ width: drop, height: drop }} />
        <AppText variant="number" style={[styles.costText, { fontSize: drop * 0.46, lineHeight: drop * 0.56, top: drop * 0.3 }]}>
          {`${def.cost}`}
        </AppText>
      </View>}
      {upgradable && !locked && !quiet && (
        <Image
          source={ICONS.up}
          accessibilityLabel={pt.cards.canUpgrade}
          style={[styles.up, { width: drop * 0.62, height: drop * 0.62, right: -drop * 0.3, bottom: -drop * 0.26 }]}
        />
      )}
      {level !== undefined && (!quiet || (level > 1 && !locked)) && (
        <AppText variant="number" color="#ffe27a" style={[styles.level, { fontSize: Math.max(10, width * 0.14), lineHeight: Math.max(12, width * 0.17) }]}>
          {pt.cards.shortLevel(level)}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderWidth: 3, borderColor: colors.outline },
  quietFrame: { borderWidth: 2 },
  quietLocked: { backgroundColor: '#48414e', opacity: 0.65 },
  quietLockOverlay: { position: 'absolute', top: 6, right: 5, padding: 3, borderRadius: 6, backgroundColor: '#141217cc' },
  quietLockIcon: { width: 16, height: 16 },
  selected: { backgroundColor: colors.accent },
  inner: { flex: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end', borderWidth: 2 },
  glow: { position: 'absolute', left: 0, right: 0, top: 0, height: 2, backgroundColor: '#e5c77f55' },
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
