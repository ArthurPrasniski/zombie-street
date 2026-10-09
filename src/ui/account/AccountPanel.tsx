import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Provider } from '@shared/api';

import { pt } from '@/i18n/pt';
import { IS_EXPO_GO } from '@/services/env';
import { deleteAccount, signIn, signOut } from '@/services/session';
import { appleAvailable } from '@/services/signIn';
import { useAccountStore } from '@/state/accountStore';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { Chunky } from '@/ui/kit/Chunky';
import { GameModal } from '@/ui/modals/GameModal';
import { colors, radius } from '@/ui/theme';

const NAMES: Record<Provider, string> = { google: 'Google', apple: 'Apple' };

/** Quando foi o último envio para a nuvem, em palavras curtas. */
function when(iso: string | null): string | null {
  if (!iso) return null;
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const d = new Date(iso);
  return `em ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Conta nos Ajustes: status, entrar com Google/Apple, sair e excluir a conta. */
export function AccountPanel() {
  const { user, online, cloud } = useAccountStore();
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
    } catch {
      setError(pt.account.failed);
    } finally {
      setBusy(false);
    }
  };

  const providers = user?.providers ?? [];
  const synced = when(cloud.syncedAt);
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
      {error && <AppText color={colors.danger}>{error}</AppText>}
      {online && (
        <View style={styles.buttons}>
          {!providers.includes('google') && <Button label={pt.account.google} variant="solid" color="#4a7ae8" size="s" disabled={busy} onPress={() => run(() => signIn('google'))} />}
          {apple && !providers.includes('apple') && <Button label={pt.account.apple} variant="solid" color="#2a2533" size="s" disabled={busy} onPress={() => run(() => signIn('apple'))} />}
          {providers.length > 0 && <Button label={pt.account.signOut} variant="dark" size="s" disabled={busy} onPress={() => run(signOut)} />}
          {user && <Button label={pt.account.delete} variant="solid" color={colors.danger} size="s" disabled={busy} onPress={() => setConfirm(true)} />}
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
