import { useEffect, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DAILY_MISSIONS } from '@zombie-road/shared/missions';
import { useMissionStore, refreshMissions, claimMission } from '@/services/missions';
import { useAccountStore } from '@/state/accountStore';
import { missionsText as text } from '@/i18n/missions';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { t as pt } from '@/i18n';
import { ICONS } from '@/ui/icons';
import { colors } from '@/ui/theme';
export default function MissionsScreen() {
 const state = useMissionStore(); const userId = useAccountStore((s) => s.user?.id); const daily = state.userId === userId ? state.daily : null;
 const [busy, setBusy] = useState(false); const [error, setError] = useState(false);
 useEffect(() => { void refreshMissions(); const timer = setInterval(() => { void refreshMissions(); }, 60000); return () => clearInterval(timer); }, []);
 return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><ScreenHeader title={text.title} /><ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
  <Button label={text.retry} variant="dark" onPress={() => { void refreshMissions(); }} />
  {!daily ? <AppText>{text.offline}</AppText> : <><AppText>{daily.day} · UTC</AppText>{DAILY_MISSIONS.map((m) => <View key={m.id} style={{ gap: 8 }}>
   <AppText variant="label">{text[m.id]}</AppText><View accessible accessibilityLabel={`${Math.min(m.target, daily.progress[m.id])}/${m.target} · ${pt.pass.coins(String(m.coins))} · ${m.xp} XP`} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}><AppText>{Math.min(m.target, daily.progress[m.id])}/{m.target} · {m.coins}</AppText><Image source={ICONS.coin} style={{ width: 18, height: 18 }} /><AppText>· {m.xp} XP</AppText></View>
   <Button label={daily.claimed.includes(m.id) ? text.claimed : text.claim} size="s" disabled={busy || daily.claimed.includes(m.id) || daily.progress[m.id] < m.target} onPress={async () => { setBusy(true); setError(false); try { await claimMission(m.id); } catch { setError(true); } finally { setBusy(false); } }} />
  </View>)}</>}{error && <AppText color={colors.danger}>{text.failed}</AppText>}
 </ScrollView></SafeAreaView>;
}
