import { localizedName } from '@/i18n/names';
import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { stageZombies, getStage } from '@/game/data/stages';
import { stageLabel, worldDef, worldOf } from '@/game/data/worlds';
import { ZOMBIES } from '@/game/data/zombies';
import { CARDS } from '@/game/data/cards';
import { tutorialText as text } from '@/i18n/tutorial';
import { useProgressStore } from '@/state/progressStore';
import { isDeckComplete } from '@/state/progress';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { colors } from '@/ui/theme';
import { t } from '@/i18n';
export default function PrepareScreen() {
 const p = useProgressStore(); const stage = p.currentStage; const world = worldDef(worldOf(stage));
 const events = [...new Set(getStage(stage).waves.flatMap((w) => w.event ? [w.event.kind] : []))];
 return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
  <ScreenHeader title={`${text.preview} · ${stageLabel(stage)}`} />
  <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
   <AppText variant="label">{text.known}</AppText>
   <AppText>{stageZombies(stage).filter((z) => z !== world.boss).map((z) => p.seen.includes(z) ? localizedName(ZOMBIES[z].name) : text.unknown).join(' · ')}</AppText>
   <AppText>{text.boss}: {p.seen.includes(world.boss) ? localizedName(ZOMBIES[world.boss].name) : text.unknown}</AppText>
   <AppText>{text.events}: {events.map((e) => t.events.title[e]).join(' · ')}</AppText>
   <AppText variant="label">{p.savedDecks[p.selectedDeck].name}</AppText><AppText>{p.deck.map((c) => localizedName(CARDS[c].name)).join(' · ')}</AppText>
   <Button label={text.deck} variant="dark" onPress={() => router.push('/deck')} />
   <Button label={text.play} disabled={!isDeckComplete(p)} onPress={() => router.replace('/combat')} />
  </ScrollView>
 </SafeAreaView>;
}
