// Textos dos avisos remotos (pt-BR, GDD seção 20). Os avisos locais ficam no app (ptPush.ts).
import { PASS_TIERS } from '@zombie-road/shared/pass';

export interface PushText {
  title: string;
  body: string;
}

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export const pushTexts = {
  gems: (gems: number): PushText => ({ title: 'Compra confirmada', body: `+${gems.toLocaleString('pt-BR')} gemas na sua conta. Bom proveito!` }),
  pass: (): PushText => ({ title: 'Passe de Batalha ativado', body: 'A trilha premium está liberada. Os prêmios já estão esperando.' }),
  billing: (): PushText => ({
    title: 'Problema no pagamento do Passe',
    body: 'Não conseguimos renovar sua assinatura. Atualize o pagamento na loja para não perder a trilha premium.',
  }),
  /** `season` no formato "2026-11". */
  season: (season: string): PushText => ({
    title: 'Nova temporada do Passe',
    body: `A temporada de ${MONTHS[Number(season.slice(5, 7)) - 1]} começou: ${PASS_TIERS} níveis de prêmios novos na estrada.`,
  }),
};
