import { retryAccountSync } from '../accountSync';

let mockState = { online: false, user: null as { id: string } | null };
const mockStart = jest.fn();
const mockPull = jest.fn();
const mockRefresh = jest.fn();
jest.mock('@/services/env', () => ({ API_URL: 'https://api.example.com' }));
jest.mock('@/services/session', () => ({ startSession: () => mockStart() }));
jest.mock('@/services/cloudSave', () => ({ pullSave: () => mockPull() }));
jest.mock('@/services/economy', () => ({ refreshEconomy: () => mockRefresh() }));
jest.mock('@/state/accountStore', () => ({ useAccountStore: { getState: () => mockState } }));

beforeEach(() => {
  jest.resetAllMocks();
  mockState = { online: false, user: null };
});

test('recovers from a failed initial session on the next retry', async () => {
  await expect(retryAccountSync()).rejects.toThrow('sem conexão');
  mockStart.mockImplementation(async () => { mockState = { online: true, user: { id: 'player' } }; });
  await expect(retryAccountSync()).resolves.toBeUndefined();
  expect(mockStart).toHaveBeenCalledTimes(2);
  expect(mockPull).not.toHaveBeenCalled();
});

test('an online account syncs without creating another session', async () => {
  mockState = { online: true, user: { id: 'player' } };
  await retryAccountSync();
  expect(mockStart).not.toHaveBeenCalled();
  expect(mockPull).toHaveBeenCalledTimes(1);
  expect(mockRefresh).toHaveBeenCalledTimes(1);
});

test('simultaneous retries share one session attempt', async () => {
  let finish!: () => void;
  mockStart.mockImplementation(() => new Promise<void>((resolve) => { finish = () => { mockState = { online: true, user: { id: 'player' } }; resolve(); }; }));
  const first = retryAccountSync();
  const second = retryAccountSync();
  expect(first).toBe(second);
  finish();
  await first;
  expect(mockStart).toHaveBeenCalledTimes(1);
});
