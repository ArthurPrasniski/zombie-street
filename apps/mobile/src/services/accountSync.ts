import { ApiError } from '@/services/api';
import { pullSave } from '@/services/cloudSave';
import { refreshEconomy } from '@/services/economy';
import { startSession } from '@/services/session';
import { useAccountStore } from '@/state/accountStore';

let pending: Promise<void> | null = null;

/** Reopen a failed session before syncing; concurrent retries share the same request. */
export function retryAccountSync(): Promise<void> {
  if (pending) return pending;
  pending = sync().finally(() => { pending = null; });
  return pending;
}

async function sync(): Promise<void> {
  const { online, user } = useAccountStore.getState();
  if (!online || !user) {
    await startSession();
  } else {
    await pullSave();
    await refreshEconomy();
  }
  if (!useAccountStore.getState().online) throw new ApiError(0, 'sem conexão');
}
