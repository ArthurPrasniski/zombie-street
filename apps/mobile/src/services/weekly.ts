import { create } from 'zustand';
import type { WeeklyAttempt, ReplayCard, WeeklyResult } from '@zombie-road/shared/weekly';
import { api } from '@/services/api';
interface State { attempt: WeeklyAttempt | null; result: WeeklyResult | null; status: 'idle' | 'checking' | 'done' | 'error' }
export const useWeeklyStore = create<State>(() => ({ attempt: null, result: null, status: 'idle' }));
export async function startWeekly() {
 const attempt = await api<WeeklyAttempt>('POST','/weekly/start');
 useWeeklyStore.setState({ attempt, result: null, status: 'idle' });
}
let last: { id: string; version: number; ticks: number; commands: ReplayCard[] } | null = null;
export async function submitWeekly(ticks?: number, commands?: ReplayCard[]) {
 const attempt = useWeeklyStore.getState().attempt; if (!attempt) return;
 if (ticks !== undefined && commands) last = { id: attempt.id, version: attempt.version, ticks, commands };
 if (!last || last.id !== attempt.id) return;
 useWeeklyStore.setState({ status: 'checking' });
 try { const result = await api<WeeklyResult>('POST','/weekly/result',last); if (useWeeklyStore.getState().attempt?.id === attempt.id) useWeeklyStore.setState({ result, status: 'done' }); }
 catch { useWeeklyStore.setState({ status: 'error' }); }
}
