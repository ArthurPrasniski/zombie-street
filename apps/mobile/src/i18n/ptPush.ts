// Notificações (GDD seção 20): avisos locais na voz do rádio, a pergunta da permissão e a seção
// de Ajustes. Os avisos remotos (compra, cobrança, temporada) o servidor escreve.

import { pt } from '@/i18n/pt';

const plural = (n: number, one: string, many: string) => (n === 1 ? `1 ${one}` : `${n} ${many}`);
const radio = (speaker: 'sheriff' | 'sniper' | 'vega') => `📻 ${pt.radio.speakers[speaker]}`;

export interface PushText {
  title: string;
  body: string;
}

export const ptPush = {
  channel: 'Avisos do rádio',
  comeback: {
    1: (stage: string): PushText => ({ title: radio('sheriff'), body: `A fase ${stage} tá esperando. A horda não vai se segurar sozinha.` }),
    3: (world: string): PushText => ({ title: radio('sniper'), body: `Faz uns dias que você sumiu do rádio. ${world} ainda precisa de você.` }),
    7: (stage: string): PushText => ({ title: radio('vega'), body: `Os esporos estão se espalhando. Volte para a estrada: fase ${stage}.` }),
  },
  upgrade: (card: string, level: number): PushText => ({ title: 'Melhoria disponível', body: `Dá para subir ${card} para o nível ${level}. As moedas já estão no bolso.` }),
  passRewards: (n: number): PushText => ({ title: 'Prêmios no Passe', body: `${plural(n, 'prêmio esperando', 'prêmios esperando')} no Passe de Batalha.` }),
  seasonEnd: (days: number, n: number): PushText => ({
    title: days === 1 ? 'A temporada acaba amanhã' : 'A temporada está acabando',
    body: `${days === 1 ? 'Amanhã' : `Em ${days} dias`} o Passe vira. Você tem ${plural(n, 'prêmio', 'prêmios')} para resgatar.`,
  }),
  dailyReset: (): PushText => ({ title: 'Novo dia na estrada', body: 'O XP do Passe e os dobros de moedas voltaram. Bora jogar?' }),
  survival: (best: number): PushText => ({ title: radio('sheriff'), body: `Você parou na onda ${best} da Sobrevivência. Aguenta a ${best + 1}?` }),

  prompt: {
    title: 'Avisos do rádio',
    body: 'Quer que o rádio chame quando der para melhorar uma carta, quando tiver prêmio no Passe ou quando a estrada sentir sua falta? No máximo um aviso por dia, só entre 9h e 21h.',
    yes: 'Quero avisos',
    no: 'Agora não',
  },

  settings: {
    section: 'Notificações',
    off: 'Notificações desligadas',
    offHint: 'Ative para receber os avisos do rádio.',
    enable: 'Ativar',
    openSystem: 'Abrir',
    deniedHint: 'Libere as notificações do Zombie Road nos ajustes do celular.',
    progress: 'Progresso',
    progressHint: 'Volta para a estrada, melhorias e recorde da Sobrevivência.',
    pass: 'Passe de Batalha',
    passHint: 'Prêmios esperando e começo e fim de temporada.',
    shop: 'Compras',
    shopHint: 'Compra confirmada e problema no pagamento do Passe.',
    news: 'Novidades',
    newsHint: 'Mundos novos e eventos.',
  },
};
