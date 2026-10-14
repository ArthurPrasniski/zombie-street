import { membershipActive } from '../membership';

jest.mock('@/state/accountStore', () => ({ useAccountStore: { getState: () => ({ user: null, membership: null }) } }));
jest.mock('@/state/progressStore', () => ({ useProgressStore: { getState: () => ({}) } }));

const member = { active: true, userId: 'player', expiresAt: '2026-11-14T12:00:00Z', autoRenew: true, grants: [] };

test('anúncios só são removidos para a conta com assinatura ativa e não expirada', () => {
  const now = Date.parse('2026-10-14T12:00:00Z');
  expect(membershipActive(member, 'player', now)).toBe(true);
  expect(membershipActive(member, 'other', now)).toBe(false);
  expect(membershipActive({ ...member, active: false }, 'player', now)).toBe(false);
  expect(membershipActive(member, 'player', Date.parse(member.expiresAt))).toBe(false);
  expect(membershipActive(null, 'player', now)).toBe(false);
});
