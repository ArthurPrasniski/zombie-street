import { useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { reliabilityText as text } from '@/i18n/reliability';
import { recoverStorePurchases } from '@/services/economy';
import { useStoreDiagnostics } from '@/services/storeDiagnostics';
import { releaseUnchargedAttempt } from '@/services/purchaseRecovery';
import { useAccountStore } from '@/state/accountStore';
import { usePurchaseStore } from '@/state/purchaseStore';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { colors } from '@/ui/theme';

export default function PurchasesScreen() {
  const { user, purchases } = useAccountStore();
  const attempts = usePurchaseStore((s) => s.attempts).filter((a) => a.userId === user?.id);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const entries = useStoreDiagnostics((s) => s.entries);
  const check = async () => {
    setBusy(true); setFailed(false);
    try { await recoverStorePurchases(); setFailed(!useAccountStore.getState().online); }
    catch { setFailed(true); }
    finally { setBusy(false); }
  };
  const email = process.env.EXPO_PUBLIC_SUPPORT_EMAIL;
  const diagnostic = [...attempts.map((a) => `${a.productId} | ${a.transactionId ?? a.id} | ${a.status}`), ...purchases.map((r) => `${r.productId} | ${r.transactionId} | ${r.refunded ? 'refunded' : 'delivered'}`)].join('\n');
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <ScreenHeader title={text.title} />
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Button label={text.check} disabled={busy} onPress={check} />
      {failed && <AppText color={colors.danger}>{text.failed}</AppText>}
      {!attempts.length && !purchases.length && <AppText>{text.empty}</AppText>}
      {attempts.filter((a) => a.status !== 'success').map((a) => <View key={a.id} style={{ gap: 4 }}>
        <AppText variant="label">{a.productId}</AppText><AppText>{text[a.status]}</AppText>
        <AppText variant="small" selectable>{a.transactionId ?? a.id}</AppText>
        {a.errorCode && <AppText variant="small" selectable>{text.errorCode(a.errorCode)}</AppText>}
        {a.status === 'pending' && !a.transactionId && a.errorCode !== '6' && <>
          <AppText variant="small" color={colors.textMuted}>{text.releaseHint}</AppText>
          <Button label={text.release} variant="dark" size="s" disabled={busy} onPress={() => releaseUnchargedAttempt(a.id)} />
        </>}
      </View>)}
      {purchases.map((r) => <View key={r.transactionId} style={{ gap: 4 }}>
        <AppText variant="label">{r.productId} · {r.refunded ? text.refunded : text.success}</AppText>
        <AppText variant="small" selectable>{r.transactionId}</AppText><AppText variant="small">{new Date(r.deliveredAt).toLocaleString()}</AppText>
      </View>)}
      {!!entries.length && <View style={{ gap: 6 }}>
        <AppText variant="label">{text.diagnostics}</AppText>
        {entries.map((entry) => <AppText key={entry.stage} variant="small" selectable>{`${entry.stage}: ${entry.code} · ${entry.at}${entry.products.length ? `\n${entry.products.join(', ')}` : ''}`}</AppText>)}
      </View>}
      {email && <Button label={text.support} variant="dark" onPress={() => Linking.openURL(`mailto:${encodeURIComponent(email)}?subject=Zombie%20Road&body=${encodeURIComponent(diagnostic)}`)} />}
    </ScrollView>
  </SafeAreaView>;
}
