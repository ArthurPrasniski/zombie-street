import { localizedName } from '@/i18n/names';
import { router } from 'expo-router';
import { View } from 'react-native';
import type { MatchStats } from '@/game/types';
import { CARD_IDS, CARDS, CARD_UNLOCKS } from '@/game/data/cards';
import { claimableCount } from '@/state/achievements';
import { useProgressStore } from '@/state/progressStore';
import { resultsText as text } from '@/i18n/results';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
export function MatchSummary({ stats, xp, failed, stage }: { stats?: MatchStats; xp: number; failed?: boolean; stage?: number }) {
 const p = useProgressStore(); const count = claimableCount(p);
 return <View style={{ gap: 6, alignSelf: 'stretch' }}>
  <AppText variant="small">{text.xp}: {xp}</AppText>
  {stats && <><AppText variant="small">{text.duration}: {Math.round(stats.duration)}s · {text.wave}: {stats.wave}</AppText>
   <AppText variant="small">{text.damage}: {Math.round(stats.damage)} · {text.base}: {Math.round(stats.baseDamage)}</AppText>
   <AppText variant="small">{text.cards}: {Object.values(stats.cards).reduce((a, n) => a + (n ?? 0), 0)}</AppText>
   {failed && <AppText variant="small">{stats.baseDamage > 0 ? text.tipDefense : text.tipCards}</AppText>}
  </>}
  {stage && CARD_IDS.filter((c) => CARD_UNLOCKS[c] === stage).map((c) => <AppText key={c} variant="small">{text.unlock}: {localizedName(CARDS[c].name)}</AppText>)}
  {!!count && <Button label={`${text.achievements}: ${count}`} size="s" variant="dark" onPress={() => router.replace('/achievements')} />}
  {failed && <View style={{ flexDirection: 'row', gap: 8 }}><Button label={text.deck} size="s" variant="dark" onPress={() => router.replace('/deck')} /><Button label={text.garage} size="s" variant="dark" onPress={() => router.replace('/garage')} /></View>}
 </View>;
}
