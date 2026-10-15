import { localizedName } from '@/i18n/names';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { Image, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { expeditionText } from '@/i18n/expedition';
import { weeklyText } from '@/i18n/weekly';
import { Button } from '@/ui/kit/Button';
import { missionsText } from '@/i18n/missions';
import { claimableCount } from '@/state/achievements';
import { CARD_IDS, CARD_UNLOCKS, CARDS , DECK_SIZE } from '@/game/data/cards';
import { STAGE_COUNT } from '@/game/data/stages';
import { globalStage, stageLabel, STAGES_PER_WORLD, worldOf } from '@/game/data/worlds';
import { t as pt } from '@/i18n';
import { useProgressStore } from '@/state/progressStore';
import { CashPill } from '@/ui/CashLabel';
import { GemPill } from '@/ui/GemLabel';
import { HazardButton } from '@/ui/home/HazardButton';
import { HomeShortcuts } from '@/ui/home/HomeShortcuts';
import { RouteProgress } from '@/ui/home/RouteProgress';
import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { IconButton, Pill } from '@/ui/kit/Pill';
import { PushPrompt } from '@/ui/push/PushPrompt';
import { colors } from '@/ui/theme';
import { worldName } from '@/ui/worldInfo';

const LOBBY = require('@/assets/pixel16-detailed/home.png');
const LOBBY_SIZE = Image.resolveAssetSource(LOBBY);
const LOBBY_RATIO = LOBBY_SIZE.height / LOBBY_SIZE.width;
const PADDING = 16;
// A rota começa dentro do degradê do fim da cena.
const FADE_OVERLAP = 44;

/** Home: cena da estrada de ponta a ponta no topo (some num degradê), rota das fases, Jogar e atalhos. */
export default function HomeScreen() {
  // Em desenvolvimento, `/?scroll=end` abre rolada até o fim (para ver os atalhos de baixo)
  const { scroll } = useLocalSearchParams<{ scroll?: string }>();
  const list = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const highestCleared = useProgressStore((s) => s.highestCleared);
  const progress = useProgressStore();
  const claims = claimableCount(progress);
  const nextCard = CARD_IDS.filter((c) => (CARD_UNLOCKS[c] ?? 0) > highestCleared).sort((a,b) => (CARD_UNLOCKS[a] ?? 0) - (CARD_UNLOCKS[b] ?? 0))[0];
  const deck = useProgressStore((s) => s.deck);
  const next = highestCleared + 1;
  const world = worldOf(next);

  const complete = deck.length === DECK_SIZE;

  // Com o deck incompleto, o botão leva para o Deck em vez de abrir a partida.
  const play = () => {
    if (!complete) {
      router.push('/deck');
      return;
    }
    useProgressStore.getState().selectStage(next);
    router.push('/prepare');
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={list}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        onContentSizeChange={() => __DEV__ && scroll === 'end' && list.current?.scrollToEnd({ animated: false })}>
        <View style={{ width, height: width * LOBBY_RATIO }}>
          <Image source={LOBBY} style={{ width, height: width * LOBBY_RATIO }} />
          <View style={[styles.overlay, { paddingTop: insets.top + 8 }]}>
            <View style={styles.topBar}>
              <View style={styles.topLeft}>
                <IconButton icon={ICONS.gear} label={pt.settings.open} onPress={() => router.push('/settings')} size={42} />
                <Pill icon={ICONS.check} label={pt.home.km(highestCleared, STAGE_COUNT)} />
              </View>
              <View style={styles.topLeft}>
                <GemPill />
                <CashPill />
              </View>
            </View>
            <AppText variant="display" stroke color={colors.gold} accessibilityRole="header" accessibilityLabel={pt.home.title} style={[styles.logo,{fontSize:width*.095,lineHeight:width*.115}]}>
              {pt.home.title}
            </AppText>
          </View>
        </View>

        <View style={[styles.content, { marginTop: -FADE_OVERLAP }]}>
          <View style={styles.route}>
            <AppText variant="eyebrow">{pt.home.route(world + 1, worldName(world))}</AppText>
            <RouteProgress first={globalStage(world, 1)} total={STAGES_PER_WORLD} cleared={highestCleared} next={next} />
            <AppText variant="small" color={complete ? colors.textMuted : colors.danger}>
              {!complete ? pt.home.deckIncomplete(deck.length, DECK_SIZE) : pt.home.nextStop(stageLabel(next))}
            </AppText>
          </View>

          <HazardButton
            label={complete ? pt.home.play : pt.home.deck}
            detail={(complete ? pt.home.stage(stageLabel(next)) : pt.home.missing(DECK_SIZE - deck.length)).toUpperCase()}
            onPress={play}
          />

          <AppText variant="small">{missionsText.next}: {claims ? `${claims} · ${pt.achievements.title}` : nextCard ? `${localizedName(CARDS[nextCard].name)} · ${stageLabel(CARD_UNLOCKS[nextCard] ?? 1)}` : missionsText.title}</AppText>
          <Button label={missionsText.title} size="s" variant="dark" onPress={() => router.push('/missions')} />
          <Button label={weeklyText.title} size="s" variant="dark" onPress={() => router.push('/weekly')} />
          <Button label={expeditionText.title} size="s" variant="dark" onPress={() => router.push('/expedition')} />
          <HomeShortcuts />
        </View>
      </ScrollView>
      <PushPrompt />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', paddingHorizontal: PADDING },
  content: { paddingHorizontal: PADDING, gap: 16 },
  topBar: { flexDirection: 'row', flexWrap:'wrap', rowGap:8, columnGap:8, alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch' },
  topLeft: { flexDirection: 'row', flexWrap:'wrap', alignItems: 'center', gap: 8 },
  logo: { marginTop: 14, textAlign: 'center', letterSpacing: 2 },
  route: { gap: 8, paddingHorizontal: 4 },
});
