import { track } from '@/services/telemetry';
import type { CloudSave } from '@zombie-road/shared/api';

import { api, ApiError, hasApiToken } from '@/services/api';
import { useAccountStore } from '@/state/accountStore';
import { pick, STORAGE_VERSION, useProgressStore } from '@/state/progressStore';
import { syncMembershipCoins } from '@/services/membership';

// Save na nuvem (docs/BACKEND.md): o progresso inteiro vai para o servidor com a revisão em que se
// baseou. Se só um lado mudou, ele vence sozinho; se os dois mudaram, o jogador escolhe.

/** Impressão digital simples do progresso, para saber se mudou desde o último envio. */
export function progressHash(data: unknown): string {
  const text = JSON.stringify(data);
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return `${text.length}:${h}`;
}

const localData = () => pick(useProgressStore.getState());
const localChanged = () => progressHash(localData()) !== useAccountStore.getState().cloud.syncedHash;
const isFresh = () => {
  const p = useProgressStore.getState();
  return p.highestCleared === 0 && p.cash === 0;
};

function adopt(save: CloudSave): void {
  useProgressStore.getState().replace(save.data, save.version);
  markSynced(save);
  syncMembershipCoins();
}

function markSynced(save: CloudSave): void {
  useAccountStore.setState({ cloud: { revision: save.revision, syncedHash: progressHash(save.data), syncedAt: save.updatedAt }, conflict: null, syncStatus: 'saved' });
}

/** Envia o progresso se mudou. Conflito: adota a nuvem se o aparelho não mudou; senão, pergunta. */
let saving: Promise<void> | null = null;
export function pushSave(): Promise<void> {
  if (saving) return saving;
  const userId = useAccountStore.getState().user?.id;
  saving = sendSave().finally(() => {
    saving = null;
    if (hasApiToken() && userId === useAccountStore.getState().user?.id && useAccountStore.getState().syncStatus === 'saved' && localChanged()) void pushSave();
  });
  return saving;
}

async function sendSave(): Promise<void> {
  if (!hasApiToken() || useAccountStore.getState().conflict) return;
  if (!localChanged()) { useAccountStore.setState({ syncStatus: 'saved' }); return; }
  const data = localData();
  const hash = progressHash(data);
  const userId = useAccountStore.getState().user?.id;
  useAccountStore.setState({ syncStatus: 'saving' });
  try {
    const save = await api<CloudSave>('PUT', '/save', { baseRevision: useAccountStore.getState().cloud.revision, version: STORAGE_VERSION, data });
    if (userId !== useAccountStore.getState().user?.id) return;
    markSynced(save);
    useAccountStore.setState({ cloud: { ...useAccountStore.getState().cloud, syncedHash: hash } });
  } catch (error) {
    if (userId !== useAccountStore.getState().user?.id) return;
    if (!(error instanceof ApiError) || error.status !== 409) { useAccountStore.setState({ syncStatus: 'error' }); track('error'); return; }
    useAccountStore.setState({ conflict: (error.body as { current: CloudSave }).current, syncStatus: 'conflict' });
  }
}

/**
 * Baixa o save da nuvem. `switched`: o login levou para outra conta; se os dois lados têm
 * progresso, o jogador escolhe.
 */
export async function pullSave(switched = false): Promise<void> {
  if (!hasApiToken()) return;
  const userId = useAccountStore.getState().user?.id;
  try {
    const save = await api<CloudSave>('GET', '/save');
    if (userId !== useAccountStore.getState().user?.id) return;
    const { cloud } = useAccountStore.getState();
    if (!switched && save.revision === cloud.revision) return pushSave();
    // Aparelho sem mudança (ou sem progresso nenhum, como uma instalação nova): a nuvem vence
    if ((!localChanged() && !switched) || isFresh()) return adopt(save);
    if (progressHash(save.data) === progressHash(localData())) return markSynced(save);
    useAccountStore.setState({ conflict: save, syncStatus: 'conflict' });
  } catch (error) {
    if (userId !== useAccountStore.getState().user?.id) return;
    // Conta sem save ainda: o progresso do aparelho vira o primeiro
    if (error instanceof ApiError && error.status === 404) {
      useAccountStore.setState({ cloud: { revision: 0, syncedHash: null, syncedAt: null } });
      await pushSave();
    } else {
      useAccountStore.setState({ syncStatus: 'error' });
    }
  }
}

/** O jogador escolheu: a nuvem (troca o progresso) ou o aparelho (sobrescreve a nuvem). */
export async function resolveConflict(keep: 'cloud' | 'device'): Promise<void> {
  const conflict = useAccountStore.getState().conflict;
  if (!conflict) return;
  if (keep === 'cloud') return adopt(conflict);
  useAccountStore.setState({ cloud: { revision: conflict.revision, syncedHash: null, syncedAt: conflict.updatedAt }, conflict: null });
  await pushSave();
}
