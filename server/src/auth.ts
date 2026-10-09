// Autenticação: a sessão do jogo é um JWT nosso (HS256). O login do Google e da Apple manda um
// idToken; aqui conferimos a assinatura dele nas chaves públicas de cada um (JWKS), o emissor e
// o público (o client ID do app), sem chamar API nenhuma do Google.
import { createRemoteJWKSet, jwtVerify, SignJWT } from 'jose';

import type { Provider } from '../../shared/api';
import type { Config } from './config';
import { HttpError } from './errors';

const SESSION_DAYS = 60;

export interface Sessions {
  sign(userId: string): Promise<string>;
  /** Id do usuário do cabeçalho `Authorization: Bearer ...`, ou erro 401. */
  verify(header: string | undefined): Promise<string>;
}

export function sessions(secret: string): Sessions {
  const key = new TextEncoder().encode(secret);
  return {
    sign: (userId) => new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject(userId).setIssuedAt().setExpirationTime(`${SESSION_DAYS}d`).sign(key),
    async verify(header) {
      const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) throw new HttpError(401, 'sem sessão');
      try {
        const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
        if (!payload.sub) throw new Error('sem sub');
        return payload.sub;
      } catch {
        throw new HttpError(401, 'sessão inválida');
      }
    },
  };
}

/** Quem é o dono do idToken, segundo o Google ou a Apple. */
export interface Identity {
  subject: string;
  email: string | null;
  name: string | null;
}

export type VerifyIdToken = (provider: Provider, token: string) => Promise<Identity>;

const GOOGLE = { jwks: 'https://www.googleapis.com/oauth2/v3/certs', issuers: ['https://accounts.google.com', 'accounts.google.com'] };
const APPLE = { jwks: 'https://appleid.apple.com/auth/keys', issuers: ['https://appleid.apple.com'] };

/** Verificador real: assinatura (JWKS), emissor, público e validade. */
export function jwksVerifier(config: Config): VerifyIdToken {
  const google = createRemoteJWKSet(new URL(GOOGLE.jwks));
  const apple = createRemoteJWKSet(new URL(APPLE.jwks));
  return async (provider, token) => {
    const isGoogle = provider === 'google';
    const audience = isGoogle ? config.googleClientIds : config.appleAudiences;
    if (audience.length === 0) throw new HttpError(503, `login ${provider} não configurado no servidor`);
    try {
      const { payload } = await jwtVerify(token, isGoogle ? google : apple, { issuer: isGoogle ? GOOGLE.issuers : APPLE.issuers, audience });
      if (!payload.sub) throw new Error('sem sub');
      const email = typeof payload.email === 'string' ? payload.email : null;
      const name = typeof payload.name === 'string' ? payload.name : null;
      return { subject: payload.sub, email, name };
    } catch {
      throw new HttpError(401, `token ${provider} inválido`);
    }
  };
}

/**
 * Só em desenvolvimento: aceita "dev:nome" como token de qualquer provedor (o Expo Go não tem o
 * login nativo). O resto vai para o verificador real.
 */
export function withDevTokens(verify: VerifyIdToken): VerifyIdToken {
  return async (provider, token) => {
    if (!token.startsWith('dev:')) return verify(provider, token);
    const name = token.slice(4) || 'dev';
    return { subject: `dev-${name}`, email: `${name}@dev.local`, name };
  };
}
