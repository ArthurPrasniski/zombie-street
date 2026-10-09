import { router } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';

import { STAGE_COUNT } from '@/game/data/stages';
import { TRUCK_PART_IDS } from '@/game/data/truck';
import { WORLDS } from '@/game/data/worlds';
import { ZOMBIE_IDS } from '@/game/data/zombies';
import { pt } from '@/i18n/pt';
import { canUpgradeCard } from '@/state/progress';
import { canUpgradeTruck } from '@/state/truck';
import { claimableCount } from '@/state/achievements';
import { useAccountStore } from '@/state/accountStore';
import { useProgressStore } from '@/state/progressStore';
import { countClaimable } from '@/ui/pass/claimable';
import { CardView } from '@/ui/cards/CardView';
import { HomeTile } from '@/ui/home/HomeTile';
import { SurvivalCard } from '@/ui/home/SurvivalCard';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { Badge } from '@/ui/kit/Badge';
import { Card } from '@/ui/kit/Card';
import { colors, radius } from '@/ui/theme';

const WALKER = require('@/assets/images/mascots/walker.png');
const FAN = [-14, 0, 14];

/** Atalhos da Home: Deck (cartas em leque e quantas podem melhorar), Fases, Sobrevivência e os atalhos pequenos (2 x 2). */
export function HomeShortcuts() {
  const progress = useProgressStore();
  const deck = progress.deck;
  const upgradable = deck.filter((card) => canUpgradeCard(progress, card)).length;
  const parts = TRUCK_PART_IDS.filter((part) => canUpgradeTruck(progress, part)).length;
  const claims = claimableCount(progress);
  // Prêmios do passe esperando resgate (aviso no atalho)
  const pass = useAccountStore((s) => s.pass);
  const claimablePass = pass ? countClaimable(pass) : 0;
  return (
    <View style={styles.list}>
      <View style={styles.row}>
        <View style={styles.half}>
          <Card color={colors.teal} containerStyle={styles.fill} style={styles.tile} padding={16} onPress={() => router.push('/deck')}>
            <View style={styles.fan}>
              {deck.slice(0, FAN.length).map((card, i) => (
                <View
                  key={card}
                  style={[
                    styles.fanCard,
                    {
                      transform: [{ rotate: `${FAN[i]}deg` }, { translateY: Math.abs(FAN[i]) * 0.4 }],
                    },
                  ]}
                >
                  <CardView card={card} width={48} hideName />
                </View>
              ))}
            </View>
            <AppText variant="title" style={styles.tileTitle}>
              {pt.home.deck.toUpperCase()}
            </AppText>
            <AppText variant="small" color={colors.accent}>
              {pt.home.deckCount(deck.length).toUpperCase()}
            </AppText>
          </Card>
          <Badge count={upgradable} color={colors.tealBright} />
        </View>
        <View style={styles.half}>
          <Card color={colors.mapCard} containerStyle={styles.fill} style={styles.tile} padding={16} onPress={() => router.push('/stages')}>
            <Image source={WALKER} style={styles.walker} />
            <AppText variant="title" style={styles.tileTitle}>
              {pt.home.stages.toUpperCase()}
            </AppText>
            <AppText variant="small" color="#9cc4ff">
              {pt.home.stagesCount(WORLDS.length, STAGE_COUNT).toUpperCase()}
            </AppText>
          </Card>
        </View>
      </View>
      <View style={styles.row}>
        <HomeTile
          icon={ICONS.bag}
          title={pt.shop.open}
          subtitle={pt.shop.subtitle}
          color={colors.featured}
          subtitleColor="#ffe2d6"
          onPress={() => router.push('/shop')}
        />
        <HomeTile
          icon={ICONS.crown}
          title={pt.pass.open}
          subtitle={pass ? pt.pass.tier(pass.tier) : pt.pass.title}
          color="#5a2a8a"
          subtitleColor="#e0c8ff"
          badge={claimablePass}
          onPress={() => router.push('/pass')}
        />
      </View>
      <SurvivalCard />
      <View style={styles.row}>
        <HomeTile
          icon={ICONS.wrench}
          title={pt.garage.open}
          subtitle={pt.garage.subtitle}
          color={colors.recordCard}
          subtitleColor="#ffb0b8"
          badge={parts}
          onPress={() => router.push('/garage')}
        />
        <HomeTile
          icon={ICONS.book}
          title={pt.bestiary.open}
          subtitle={pt.bestiary.found(progress.seen.length, ZOMBIE_IDS.length)}
          color={colors.surfaceHigh}
          subtitleColor={colors.textMuted}
          onPress={() => router.push('/bestiary')}
        />
      </View>
      <View style={styles.row}>
        <HomeTile
          icon={ICONS.trophy}
          title={pt.achievements.open}
          subtitle={pt.achievements.subtitle(claims)}
          color={colors.mapCard}
          subtitleColor="#9cc4ff"
          badge={claims}
          onPress={() => router.push('/achievements')}
        />
        <HomeTile
          icon={ICONS.radio}
          title={pt.diary.open}
          subtitle={pt.diary.subtitle(progress.radioHeard.length)}
          color={colors.teal}
          subtitleColor={colors.accent}
          onPress={() => router.push('/diary')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 16 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  fill: { flex: 1 },
  tile: { minHeight: 150, borderRadius: radius.l },
  fan: {
    flexDirection: 'row',
    justifyContent: 'center',
    height: 70,
    marginBottom: 6,
  },
  fanCard: { marginHorizontal: -6 },
  tileTitle: { fontSize: 24, lineHeight: 28 },
  walker: { alignSelf: 'center', width: 76, height: 76 },
});
