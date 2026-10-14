import { router } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { expeditionText as text } from '@/i18n/expedition';
import { EXPEDITION_UNLOCK } from '@/game/data/expedition';
import { useProgressStore } from '@/state/progressStore';
import { isDeckComplete } from '@/state/progress';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { Button } from '@/ui/kit/Button';
import { AppText } from '@/ui/kit/AppText';
import { colors } from '@/ui/theme';
export default function ExpeditionScreen() {
 const p = useProgressStore();
 return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><ScreenHeader title={text.title} /><View style={{ padding: 16, gap: 16 }}>
  <AppText>{text.hint}</AppText><AppText>{p.expeditionBest} · {text.title}</AppText>
  <Button label={text.play} disabled={p.highestCleared < EXPEDITION_UNLOCK || !isDeckComplete(p)} onPress={() => router.push('/combat?mode=expedition')} />
 </View></SafeAreaView>;
}
