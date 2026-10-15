import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Provider } from '@zombie-road/shared/api';

import { reliabilityText } from '@/i18n/reliability';
import { retryAccountSync } from '@/services/accountSync';
import { t as pt } from '@/i18n';
import { formatSyncTime } from '@/utils/syncTime';
import { ApiError } from '@/services/api';
import { usePurchaseStore } from '@/state/purchaseStore';
import { IS_EXPO_GO } from '@/services/env';
import { deleteAccount, signIn, signOut } from '@/services/session';
import { appleAvailable } from '@/services/signIn';
import { useAccountStore } from '@/state/accountStore';
import { ProviderLoginButtons } from '@/ui/account/ProviderLoginButtons';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { Chunky } from '@/ui/kit/Chunky';
import { GameModal } from '@/ui/modals/GameModal';
import { colors, radius } from '@/ui/theme';

const NAMES: Record<Provider, string> = { google: 'Google', apple: 'Apple' };

/** Conta nos Ajustes: status, entrar com Google/Apple, sair e excluir a conta. */
export function AccountPanel() {
  const { user, online, cloud, syncStatus } = useAccountStore();
  const purchasing = usePurchaseStore((s) => s.attempts.some((a) => a.userId === user?.id && ['buying','confirming'].includes(a.status)));
  const [apple, setApple] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    appleAvailable().then(setApple).catch(() => null);
  }, []);

  const run = async (task: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (cause) {
      // Mantém tokens e dados pessoais fora do log; registra apenas códigos de diagnóstico.
      if (__DEV__) {
        const diagnostic = cause as { code?: unknown; status?: unknown } | null;
        console.warn('[Account] Falha na operação da conta', {
          code: typeof diagnostic?.code === 'string' || typeof diagnostic?.code === 'number' ? diagnostic.code : 'unknown',
          httpStatus: typeof diagnostic?.status === 'number' ? diagnostic.status : null,
          endpoint: cause instanceof ApiError ? cause.requestPath : null,
          reason: cause instanceof ApiError && ['token google inválido', 'token apple inválido', 'sessão inválida', 'sem sessão'].includes(cause.message) ? cause.message : null,
        });
      }
      setError(pt.account.failed);
    } finally {
      setBusy(false);
    }
  };

  const providers = user?.providers ?? [];
  const synced = formatSyncTime(cloud.syncedAt);
  return (
    <Chunky face={colors.surfaceHigh} edge="#16131a" radius={radius.m} depth={4} gloss={0.05} faceStyle={styles.panel}>
      <AppText variant="label">{providers.length ? pt.account.linked(providers.map((p) => NAMES[p]).join(' e ')) : pt.account.guest}</AppText>
      <AppText variant="small" color={colors.textMuted}>
        {!online ? pt.account.offline : providers.length ? (user?.email ?? '') : pt.account.guestHint}
      </AppText>
      {online && (
        <AppText variant="small" color={synced ? colors.accent : colors.textMuted}>
          {synced ? pt.account.synced(synced) : pt.account.notSynced}
        </AppText>
      )}
      <AppText variant="small">{syncStatus === 'error' ? reliabilityText.failed : reliabilityText[syncStatus]}</AppText>
      <Button label={reliabilityText.retry} variant="dark" size="s" disabled={busy || purchasing || syncStatus === 'saving'} onPress={() => run(retryAccountSync)} />
      {error && <AppText color={colors.danger}>{error}</AppText>}
      {online && (
        <ProviderLoginButtons
          providers={providers}
          appleAvailable={apple}
          busy={busy || purchasing}
          onGoogle={() => run(() => signIn('google'))}
          onApple={() => run(() => signIn('apple'))}
        />
      )}
      {online && (
        <View style={styles.buttons}>
          {providers.length > 0 && <Button label={pt.account.signOut} variant="dark" size="s" disabled={busy || purchasing} onPress={() => run(signOut)} />}
          {user && <Button label={pt.account.delete} variant="solid" color={colors.danger} size="s" disabled={busy || purchasing} onPress={() => setConfirm(true)} />}
        </View>
      )}
      {IS_EXPO_GO && online && (
        <AppText variant="small" color={colors.textMuted}>
          {pt.account.devNote}
        </AppText>
      )}
      {confirm && (
        <GameModal
          title={pt.account.deleteTitle}
          accent={colors.danger}
          buttons={
            <>
              <Button label={pt.account.cancel} variant="dark" onPress={() => setConfirm(false)} />
              <Button label={pt.account.deleteConfirm} variant="solid" color={colors.danger} onPress={() => run(async () => { setConfirm(false); await deleteAccount(); })} />
            </>
          }>
          <AppText color={colors.textMuted} style={styles.center}>
            {pt.account.deleteBody}
          </AppText>
        </GameModal>
      )}
    </Chunky>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 14, gap: 6 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  center: { textAlign: 'center' },
});
