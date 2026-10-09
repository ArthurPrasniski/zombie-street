import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import type { Provider, Session } from '@zombie-road/shared/api';

import { api, ApiError, setApiToken } from '@/services/api';
import { pullSave } from '@/services/cloudSave';
import { flushXp, refreshEconomy } from '@/services/economy';
import { API_URL } from '@/services/env';
import { identifyPurchaser } from '@/services/purchases';
import { syncPushToken } from '@/services/push/remote';
import { appleToken, googleSignOut, googleToken } from '@/services/signIn';
import { INITIAL_ACCOUNT, useAccountStore } from '@/state/accountStore';

// Sessão (docs/BACKEND.md): todo aparelho começa como convidado (conta no servidor ligada a um id
// aleatório guardado no cofre do aparelho). Entrar com Google/Apple vincula essa conta, ou troca
// para a conta que já existia. Sem servidor, o jogo segue offline.

const TOKEN_KEY = 'zr-session';
const DEVICE_KEY = 'zr-device';

async function deviceId(): Promise<string> {
  const saved = await SecureStore.getItemAsync(DEVICE_KEY);
  if (saved) return saved;
  const id = `${Crypto.randomUUID()}${Crypto.randomUUID()}`.replace(/-/g, '');
  await SecureStore.setItemAsync(DEVICE_KEY, id);
  return id;
}

/** Guarda a sessão e prepara o resto (compras, carteira, passe, save). */
async function applySession(session: Session): Promise<void> {
  setApiToken(session.token);
  await SecureStore.setItemAsync(TOKEN_KEY, session.token);
  useAccountStore.setState({ user: session.user, online: true });
  await identifyPurchaser(session.user.id).catch(() => null);
  await Promise.all([refreshEconomy(), flushXp(), pullSave(session.switched === true)]);
  // O aparelho passa a receber os avisos desta conta
  await syncPushToken().catch(() => null);
}

/** Abre o app: retoma a sessão salva ou entra como convidado. Falha em silêncio (offline). */
export async function startSession(): Promise<void> {
  if (!API_URL) return;
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      setApiToken(token);
      try {
        const user = await api<Session['user']>('GET', '/me');
        await applySession({ token, user });
        return;
      } catch (error) {
        // Sessão vencida ou conta apagada: volta a ser convidado
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
        setApiToken(null);
      }
    }
    await applySession(await api<Session>('POST', '/auth/guest', { deviceId: await deviceId() }));
  } catch {
    useAccountStore.setState({ online: false });
  }
}

/** Entrar com Google ou Apple. false = o jogador cancelou. */
export async function signIn(provider: Provider): Promise<boolean> {
  const result = provider === 'google' ? await googleToken() : await appleToken();
  if (!result) return false;
  const body = provider === 'google' ? { idToken: result.token } : { identityToken: result.token, name: result.name ?? null };
  await applySession(await api<Session>('POST', `/auth/${provider}`, body));
  return true;
}

/** Sair: volta a ser o convidado deste aparelho. O progresso do aparelho fica. */
export async function signOut(): Promise<void> {
  await googleSignOut();
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  setApiToken(null);
  useAccountStore.setState({ ...INITIAL_ACCOUNT, applied: useAccountStore.getState().applied, ads: useAccountStore.getState().ads });
  await startSession();
}

/** Excluir a conta no servidor (exigência das lojas). O aparelho ganha um convidado novo. */
export async function deleteAccount(): Promise<void> {
  await api('DELETE', '/me');
  await SecureStore.deleteItemAsync(DEVICE_KEY);
  await signOut();
}
