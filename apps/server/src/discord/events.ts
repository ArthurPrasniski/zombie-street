import type { Config } from '../config';
import type { Queryable } from '../db';

export type MonitorEvent =
  | { kind: 'signup'; userId: string; provider: string; occurredAt: string }
  | { kind: 'gems'; userId: string | null; provider: string; productId: string; gems: number; transactionId: string; amount: number | null; currency: string | null; store: string; occurredAt: string };
export type Monitor = (q: Queryable, event: MonitorEvent) => Promise<void>;

/** Só registra quando o webhook foi configurado neste servidor de produção. */
export function createMonitor(config: Config): Monitor | undefined {
  if (!config.production || !config.discordWebhookUrl) return undefined;
  return async (q, event) => {
    const ref = event.kind === 'signup' ? `signup:${event.userId}` : `gems:${event.transactionId}`;
    await q.query('insert into discord_outbox (ref, payload) values ($1, $2) on conflict do nothing', [ref, JSON.stringify(event)]);
  };
}

const field = (name: string, value: string) => ({ name, value: value.replace(/[\\`*_~|]/g, '\\$&').slice(0, 1024), inline: true });

export function discordMessage(event: MonitorEvent) {
  const fields = [field('Jogador', event.userId ?? 'Não identificado'), field('Provedor', event.provider)];
  if (event.kind === 'gems') {
    fields.push(field('Produto', event.productId), field('Gemas', String(event.gems)));
    let price = 'Não informado pela loja';
    if (event.amount !== null && event.currency) {
      try { price = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: event.currency }).format(event.amount); }
      catch { price = `${event.amount} ${event.currency}`; }
    }
    fields.push(field('Valor bruto', price), field('Moeda', event.currency ?? 'Não informada'), field('Loja', event.store), field('Transação', event.transactionId));
  }
  return {
    username: 'Zombie Road',
    allowed_mentions: { parse: [] },
    embeds: [{
      title: event.kind === 'signup' ? '🧟 Novo jogador' : '💎 Venda de gemas',
      color: event.kind === 'signup' ? 0xb8e835 : 0x4a90e2,
      fields,
      timestamp: event.occurredAt,
      footer: { text: `Zombie Road • Produção • ${event.kind === 'signup' ? event.userId : event.transactionId}`.slice(0, 2048) },
    }],
  };
}
