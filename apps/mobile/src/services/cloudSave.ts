import type { CloudSave } from '@zombie-road/shared/api';

import { api, ApiError, hasApiToken } from '@/services/api';
import { useAccountStore } from '@/state/accountStore';
import { pick, STORAGE_VERSION, useProgressStore } from '@/state/progressStore';

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
}

function markSynced(save: CloudSave): void {
  useAccountStore.setState({ cloud: { revision: save.revision, syncedHash: progressHash(localData()), syncedAt: save.updatedAt }, conflict: null });
}

/** Envia o progresso se mudou. Conflito: adota a nuvem se o aparelho não mudou; senão, pergunta. */
export async function pushSave(): Promise<void> {
  if (!hasApiToken() || !localChanged()) return;
  try {
    const save = await api<CloudSave>('PUT', '/save', { baseRevision: useAccountStore.getState().cloud.revision, version: STORAGE_VERSION, data: localData() });
    markSynced(save);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 409) return;
    useAccountStore.setState({ conflict: (error.body as { current: CloudSave }).current });
  }
}

/**
 * Baixa o save da nuvem. `switched`: o login levou para outra conta; se os dois lados têm
 * progresso, o jogador escolhe.
 */
export async function pullSave(switched = false): Promise<void> {
  if (!hasApiToken()) return;
  try {
    const save = await api<CloudSave>('GET', '/save');
    const { cloud } = useAccountStore.getState();
    if (!switched && save.revision === cloud.revision) return pushSave();
    // Aparelho sem mudança (ou sem progresso nenhum, como uma instalação nova): a nuvem vence
    if ((!localChanged() && !switched) || isFresh()) return adopt(save);
    if (progressHash(save.data) === progressHash(localData())) return markSynced(save);
    useAccountStore.setState({ conflict: save });
  } catch (error) {
    // Conta sem save ainda: o progresso do aparelho vira o primeiro
    if (error instanceof ApiError && error.status === 404) {
      useAccountStore.setState({ cloud: { revision: 0, syncedHash: null, syncedAt: null } });
      await pushSave();
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
