// Envio pelo serviço de push da Expo (docs.expo.dev, "Send notifications with the Expo Push
// Service"): o mesmo pedido serve para iOS (APNs) e Android (FCM), com as credenciais de cada loja
// cadastradas no EAS. Sem biblioteca: um POST com até 100 mensagens.
import type { PushData } from '@zombie-road/shared/push';

export const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
/** Canal do Android criado pelo app (as notificações remotas chegam nele). */
export const PUSH_CHANNEL = 'default';
const CHUNK = 100;

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data: PushData;
  sound: 'default';
  channelId: string;
}

export type PushResult = { ok: true } | { ok: false; error: string; unregistered: boolean };
/** Manda as mensagens e devolve um resultado para cada uma, na mesma ordem. */
export type PushSender = (messages: PushMessage[]) => Promise<PushResult[]>;

type Ticket = { status: 'ok'; id: string } | { status: 'error'; message: string; details?: { error?: string } };

export function expoSender(accessToken: string | null, fetchFn: typeof fetch = fetch): PushSender {
  return async (messages) => {
    const results: PushResult[] = [];
    for (let i = 0; i < messages.length; i += CHUNK) {
      const chunk = messages.slice(i, i + CHUNK);
      try {
        const res = await fetchFn(EXPO_PUSH_URL, {
          method: 'POST',
          headers: { accept: 'application/json', 'content-type': 'application/json', ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}) },
          body: JSON.stringify(chunk),
        });
        const json = (await res.json()) as { data?: Ticket[]; errors?: { message: string }[] };
        if (!res.ok || !Array.isArray(json.data)) throw new Error(json.errors?.[0]?.message ?? `HTTP ${res.status}`);
        for (const ticket of json.data) {
          // Aparelho desinstalou o app ou desligou os avisos: o token não serve mais
          results.push(ticket.status === 'ok' ? { ok: true } : { ok: false, error: ticket.message, unregistered: ticket.details?.error === 'DeviceNotRegistered' });
        }
      } catch (error) {
        for (let k = 0; k < chunk.length; k++) results.push({ ok: false, error: String(error), unregistered: false });
      }
    }
    return results;
  };
}

export const isExpoPushToken = (token: string): boolean => /^Expo(nent)?PushToken\[[\w-]+\]$/.test(token);
