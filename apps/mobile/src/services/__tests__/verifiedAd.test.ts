import { displayVerifiedAd } from '../verifiedAd';
type AdsModule = typeof import('react-native-google-mobile-ads');
function sdk() {
  const callbacks = new Map<string, () => void>();
  const show = jest.fn().mockResolvedValue(undefined);
  const create = jest.fn().mockReturnValue({ load: jest.fn(), show,
    addAdEventListener: (event: string, callback: () => void) => { callbacks.set(event, callback); return () => { callbacks.delete(event); }; },
  });
  const mod = { RewardedAd: { createForAdRequest: create }, RewardedAdEventType: { LOADED: 'loaded', EARNED_REWARD: 'earned' }, AdEventType: { CLOSED: 'closed', ERROR: 'error' } } as unknown as AdsModule;
  return { mod, callbacks, show, create };
}
afterEach(() => jest.useRealTimers());

test('vincula o anúncio ao pedido e só conclui após o fechamento com prêmio', async () => {
  const { mod, callbacks, show, create } = sdk();
  const result = displayVerifiedAd(mod, 'unit', 'user', 'ticket');
  expect(create).toHaveBeenCalledWith('unit', { serverSideVerificationOptions: { userId: 'user', customData: 'ticket' } });
  expect(show).not.toHaveBeenCalled();
  callbacks.get('loaded')!();
  expect(show).toHaveBeenCalledTimes(1);
  callbacks.get('earned')!(); callbacks.get('closed')!();
  await expect(result).resolves.toBe(true);
  expect(callbacks.size).toBe(0);
});

test('fechar sem recompensa não valida a conclusão', async () => {
  const { mod, callbacks } = sdk();
  const result = displayVerifiedAd(mod, 'unit', 'user', 'ticket');
  callbacks.get('loaded')!(); callbacks.get('closed')!();
  await expect(result).resolves.toBe(false);
});

test('assinatura ativada ou conta trocada durante carregamento impede exibir o anúncio', async () => {
  const { mod, callbacks, show } = sdk();
  const result = displayVerifiedAd(mod, 'unit', 'user', 'ticket', () => false);
  callbacks.get('loaded')!();
  await expect(result).resolves.toBe(false);
  expect(show).not.toHaveBeenCalled();
});

test('carregamento expirado não abre anúncio tardio; anúncio já aberto pode durar mais que 45 segundos', async () => {
  jest.useFakeTimers();
  const first = sdk();
  const expired = displayVerifiedAd(first.mod, 'unit', 'user', 'ticket');
  await jest.advanceTimersByTimeAsync(45000);
  await expect(expired).resolves.toBe(false);
  expect(first.callbacks.size).toBe(0);
  expect(first.show).not.toHaveBeenCalled();
  const second = sdk();
  const active = displayVerifiedAd(second.mod, 'unit', 'user', 'ticket2');
  second.callbacks.get('loaded')!();
  await jest.advanceTimersByTimeAsync(90000);
  expect(second.callbacks.size).toBeGreaterThan(0);
  second.callbacks.get('earned')!(); second.callbacks.get('closed')!();
  await expect(active).resolves.toBe(true);
});
