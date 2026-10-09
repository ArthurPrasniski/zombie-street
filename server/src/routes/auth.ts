// Rotas de conta: convidado, Google, Apple, quem sou eu e excluir conta.
import type { FastifyInstance } from 'fastify';

import type { AppleLogin, GoogleLogin, GuestLogin, Provider, Session } from '../../../shared/api';
import type { Deps } from '../app';
import { deleteUser, guestUser, loginWithProvider, userInfo } from '../store/users';

const str = (min = 1) => ({ type: 'string', minLength: min, maxLength: 8192 });

export function authRoutes(app: FastifyInstance, deps: Deps): void {
  const { db, sessions, verifyIdToken } = deps;
  const session = async (userId: string, switched = false): Promise<Session> => ({ token: await sessions.sign(userId), user: await userInfo(db, userId), switched });
  /** Sessão atual, se o pedido trouxe uma (para vincular o login à conta do convidado). */
  const optionalUser = async (header: string | undefined) => (header ? sessions.verify(header).catch(() => null) : null);

  app.post<{ Body: GuestLogin }>('/auth/guest', { schema: { body: { type: 'object', required: ['deviceId'], properties: { deviceId: str(16) } } } }, async (req) =>
    session(await guestUser(db, req.body.deviceId)),
  );

  const providerLogin = async (provider: Provider, token: string, header: string | undefined, name?: string | null) => {
    const identity = await verifyIdToken(provider, token);
    const result = await loginWithProvider(db, provider, { ...identity, name: identity.name ?? name ?? null }, await optionalUser(header));
    return session(result.userId, result.switched);
  };

  app.post<{ Body: GoogleLogin }>('/auth/google', { schema: { body: { type: 'object', required: ['idToken'], properties: { idToken: str() } } } }, (req) =>
    providerLogin('google', req.body.idToken, req.headers.authorization),
  );

  app.post<{ Body: AppleLogin }>(
    '/auth/apple',
    { schema: { body: { type: 'object', required: ['identityToken'], properties: { identityToken: str(), name: { type: ['string', 'null'], maxLength: 200 } } } } },
    // A Apple só manda o nome no primeiro login, pelo app (não vem no token)
    (req) => providerLogin('apple', req.body.identityToken, req.headers.authorization, req.body.name),
  );

  app.get('/me', async (req) => userInfo(db, await sessions.verify(req.headers.authorization)));

  app.delete('/me', async (req, reply) => {
    await deleteUser(db, await sessions.verify(req.headers.authorization));
    return reply.code(204).send();
  });
}
