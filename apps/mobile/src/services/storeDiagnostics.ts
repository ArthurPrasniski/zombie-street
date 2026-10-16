import { create } from 'zustand';

type Stage = 'identity' | 'gems' | 'pass' | 'membership' | 'membershipPlans' | 'offerings' | 'purchase' | 'sync';
interface Diagnostic { stage: Stage; code: string; at: string; products: string[] }
export const useStoreDiagnostics = create<{ entries: Diagnostic[] }>(() => ({ entries: [] }));

/** Keep only fixed operation names and bounded error codes, never raw SDK messages. */
export function storeErrorCode(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  return /^[A-Z0-9_]{1,48}$/.test(code) ? code : 'UNKNOWN';
}

export function recordStoreDiagnostic(stage: Stage, error?: unknown, products: string[] = []): void {
  const entry = { stage, code: error === undefined ? 'OK' : storeErrorCode(error), at: new Date().toISOString(), products: products.filter((id) => /^zr_[a-z0-9_:.-]{1,80}$/.test(id)).slice(0, 12) };
  useStoreDiagnostics.setState((s) => ({ entries: [...s.entries.filter((e) => e.stage !== stage), entry] }));
}
