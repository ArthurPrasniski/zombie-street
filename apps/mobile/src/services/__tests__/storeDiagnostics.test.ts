import { recordStoreDiagnostic, storeErrorCode, useStoreDiagnostics } from '../storeDiagnostics';

beforeEach(() => useStoreDiagnostics.setState({ entries: [] }));

test('retains only the last result of each stage', () => {
  recordStoreDiagnostic('membership', { code: '23' });
  recordStoreDiagnostic('membership', undefined, ['zr_membership_monthly:monthly']);
  expect(useStoreDiagnostics.getState().entries).toHaveLength(1);
  expect(useStoreDiagnostics.getState().entries[0]).toMatchObject({ code: 'OK', products: ['zr_membership_monthly:monthly'] });
});

test('excludes raw SDK messages, personal data and unrecognized identifiers', () => {
  recordStoreDiagnostic('purchase', { code: '6', message: 'user@example.com secret-token', userInfo: { token: 'secret-token' } }, ['user@example.com', 'secret-token', 'zr_gems_80']);
  const state = JSON.stringify(useStoreDiagnostics.getState());
  expect(state).not.toMatch(/user@example|secret-token|userInfo/);
  expect(state).toContain('zr_gems_80');
  expect(storeErrorCode({ code: 'user@example.com' })).toBe('UNKNOWN');
});
