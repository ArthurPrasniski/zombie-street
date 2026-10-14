import { membershipReward } from '@/state/membershipRewards';
import { migrateProgress } from '@/state/migrate';
import { initialProgress } from '@/state/progress';

const grant = { id: 'monthly-transaction', coins: 10000, refunded: false };

test('pacote mensal soma uma vez e o recibo acompanha o save', () => {
  const p = membershipReward(initialProgress(), grant);
  expect(p.cash).toBe(10000);
  expect(membershipReward(p, grant)).toBe(p);
  const restored = migrateProgress(JSON.parse(JSON.stringify(p)), 10);
  expect(membershipReward(restored, grant)).toBe(restored);
  expect(membershipReward(restored, { ...grant, id: 'renewal' }).cash).toBe(20000);
});

test('reembolso desconta as moedas uma vez sem deixar negativo', () => {
  const paid = membershipReward(initialProgress(), grant);
  const spent = { ...paid, cash: 100 };
  const refund = membershipReward(spent, { ...grant, refunded: true });
  expect(refund.cash).toBe(0);
  expect(membershipReward(refund, { ...grant, refunded: true })).toBe(refund);
  expect(membershipReward(refund, grant)).toBe(refund);
});

test('reembolso recebido antes da entrega não desconta outras moedas nem libera pacote atrasado', () => {
  const p = membershipReward({ ...initialProgress(), cash: 50 }, { ...grant, refunded: true });
  expect(p.cash).toBe(50);
  expect(membershipReward(p, grant)).toBe(p);
});

test('save antigo recebe lista de recibos vazia e mantém saldo', () => {
  const migrated = migrateProgress({ cash: 15, membershipRewards: null }, 9);
  expect(migrated.membershipRewards).toEqual([]);
  expect(migrated.cash).toBe(15);
});
