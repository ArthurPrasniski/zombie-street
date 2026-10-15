import { accountErrorMessage } from '../accountErrors';
import { ApiError } from '../api';

jest.mock('@/services/env', () => ({ API_URL: 'https://api.example.com' }));

test('distingue configuração Google de rejeição do servidor', () => {
  expect(accountErrorMessage({ code: '10', message: 'private-token' })).toContain('código 10');
  expect(accountErrorMessage(new ApiError(401, 'private-token', null, '/auth/google'))).toContain('401');
});

test('não exibe mensagens, tokens nem códigos arbitrários', () => {
  expect(accountErrorMessage({ code: 'user@example.com', message: 'private-token' })).not.toMatch(/user@|private-token/);
  expect(accountErrorMessage(new Error('private-token'))).not.toContain('private-token');
});
