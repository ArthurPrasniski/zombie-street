// Rotas do jogo: save na nuvem, carteira de gemas, loja de moedas e Passe de Batalha.
import type { FastifyInstance } from 'fastify';

import type { AddXp, BuyCoins, ClaimPass, PutSave } from '../../../shared/api';
import { COIN_PACK_IDS } from '../../../shared/catalog';
import { PASS_TIERS } from '../../../shared/pass';
import type { Deps } from '../app';
import { HttpError } from '../errors';
import { addXp, claim, passState } from '../store/pass';
import { getSave, putSave } from '../store/saves';
import { buyCoins, getGems } from '../store/wallet';

const int = (min: number, max = 1e9) => ({ type: 'integer', minimum: min, maximum: max });

export function gameRoutes(app: FastifyInstance, deps: Deps): void {
  const { db, sessions, now } = deps;
  const user = (header: string | undefined) => sessions.verify(header);

  app.get('/save', async (req) => {
    const save = await getSave(db, await user(req.headers.authorization));
    if (!save) throw new HttpError(404, 'sem save na nuvem');
    return save;
  });

  app.put<{ Body: PutSave }>(
    '/save',
    { schema: { body: { type: 'object', required: ['baseRevision', 'version', 'data'], properties: { baseRevision: int(0), version: int(1, 1000), data: { type: 'object' } } } } },
    async (req, reply) => {
      const result = await putSave(db, await user(req.headers.authorization), req.body);
      // Conflito: outro aparelho salvou depois; devolve o save da nuvem para o app decidir
      return result.ok ? result.save : reply.code(409).send({ error: 'conflito', current: result.current });
    },
  );

  app.get('/wallet', async (req) => ({ gems: await getGems(db, await user(req.headers.authorization)) }));

  app.post<{ Body: BuyCoins }>(
    '/shop/coins',
    {
      schema: {
        body: { type: 'object', required: ['pack', 'stage', 'requestId'], properties: { pack: { enum: COIN_PACK_IDS }, stage: int(1, 100000), requestId: { type: 'string', minLength: 8, maxLength: 64 } } },
      },
    },
    async (req) => buyCoins(db, await user(req.headers.authorization), req.body),
  );

  app.get('/pass', async (req) => passState(db, await user(req.headers.authorization), now()));

  app.post<{ Body: AddXp }>('/pass/xp', { schema: { body: { type: 'object', required: ['amount'], properties: { amount: int(0, 10000) } } } }, async (req) =>
    addXp(db, await user(req.headers.authorization), req.body.amount, now()),
  );

  app.post<{ Body: ClaimPass }>(
    '/pass/claim',
    { schema: { body: { type: 'object', required: ['tier', 'track', 'stage'], properties: { tier: int(1, PASS_TIERS), track: { enum: ['free', 'premium'] }, stage: int(1, 100000) } } } },
    async (req) => claim(db, await user(req.headers.authorization), req.body, now()),
  );
}
