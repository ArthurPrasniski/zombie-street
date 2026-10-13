// Textos dos avisos remotos (pt-BR, GDD seção 20). Os avisos locais ficam no app (ptPush.ts).
import { PASS_SEASON_DAYS, PASS_TIERS, seasonEnd } from '@zombie-road/shared/pass';

export interface PushText {
  title: string;
  body: string;
  localized?: Partial<Record<'en' | 'es', { title: string; body: string }>>;
}

const localized = (pt: { title: string; body: string }, en: { title: string; body: string }, es: { title: string; body: string }): PushText => ({ ...pt, localized: { en, es } });

export const pushTexts = {
  gems: (gems: number): PushText => localized(
    { title: 'Compra confirmada', body: `+${gems.toLocaleString('pt-BR')} gemas na sua conta. Bom proveito!` },
    { title: 'Purchase confirmed', body: `+${gems.toLocaleString('en-US')} gems in your account. Enjoy!` },
    { title: 'Compra confirmada', body: `+${gems.toLocaleString('es-ES')} gemas en tu cuenta. ¡Disfrútalas!` },
  ),
  pass: (): PushText => localized(
    { title: 'Passe de Batalha ativado', body: 'A trilha premium está liberada. Os prêmios já estão esperando.' },
    { title: 'Battle Pass activated', body: 'The premium track is unlocked. Your rewards are waiting.' },
    { title: 'Pase de Batalla activado', body: 'La ruta premium está desbloqueada. Tus premios te esperan.' },
  ),
  billing: (): PushText => localized({
    title: 'Problema no pagamento do Passe',
    body: 'Não conseguimos renovar sua assinatura. Atualize o pagamento na loja para não perder a trilha premium.',
  },
    { title: 'Pass payment issue', body: 'Your subscription could not renew. Update your store payment details to keep the premium track.' },
    { title: 'Problema con el pago del Pase', body: 'No pudimos renovar tu suscripción. Actualiza el pago en la tienda para conservar la ruta premium.' },
  ),
  /** `season` é a data de início do período em UTC. */
  season: (season: string): PushText => localized({
    title: 'Nova temporada do Passe',
    body: `A temporada começou: ${PASS_TIERS} níveis de prêmios por ${PASS_SEASON_DAYS} dias, até ${seasonEnd(season).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}.`,
  },
    { title: 'New Pass season', body: `The season has started: ${PASS_TIERS} reward tiers over ${PASS_SEASON_DAYS} days, until ${seasonEnd(season).toLocaleDateString('en-US', { timeZone: 'UTC' })}.` },
    { title: 'Nueva temporada del Pase', body: `La temporada empezó: ${PASS_TIERS} niveles de premios durante ${PASS_SEASON_DAYS} días, hasta el ${seasonEnd(season).toLocaleDateString('es-ES', { timeZone: 'UTC' })}.` },
  ),
};
