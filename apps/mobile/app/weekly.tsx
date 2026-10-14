import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import type { WeeklyConfig } from '@zombie-road/shared/weekly';
import { weeklyText as text } from '@/i18n/weekly';
import { api } from '@/services/api';
import { startWeekly } from '@/services/weekly';
import { Button } from '@/ui/kit/Button';
import { AppText } from '@/ui/kit/AppText';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { colors } from '@/ui/theme';
export default function WeeklyScreen() {
 const [medals,setMedals] = useState<{ week: string; medal: number }[]>([]);
 const [config,setConfig] = useState<WeeklyConfig | null>(null); const [busy,setBusy] = useState(false); const [error,setError] = useState(false);
 useEffect(() => { api<WeeklyConfig>('GET','/weekly').then(setConfig).catch(() => setError(true)); api<{ week: string; medal: number }[]>('GET','/weekly/medals').then(setMedals).catch(() => null); }, []);
 return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><ScreenHeader title={text.title} /><View style={{ padding: 16, gap: 16 }}>
  <AppText>{text.hint}</AppText>{config && <AppText>{config.week} · {text.ends}: {config.endsAt.slice(0,10)}</AppText>}
  <Button label={text.start} disabled={busy} onPress={async () => { setBusy(true); setError(false); try { await startWeekly(); router.push('/combat?mode=weekly'); } catch { setError(true); } finally { setBusy(false); } }} />
  {medals.map((m) => <AppText key={m.week}>{m.week} · {text.medal}: {m.medal}/3</AppText>)}
  {error && <AppText color={colors.danger}>{text.error}</AppText>}
 </View></SafeAreaView>;
}
