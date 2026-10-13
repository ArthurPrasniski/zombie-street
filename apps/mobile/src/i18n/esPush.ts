// Notificações (GDD seção 20): avisos locais na voz do rádio, a pergunta da permissão e a seção
// de Ajustes. Os avisos remotos (compra, cobrança, temporada) o servidor escreve.

import { es as pt } from '@/i18n/es';

const plural = (n: number, one: string, many: string) => (n === 1 ? `1 ${one}` : `${n} ${many}`);
const radio = (speaker: 'sheriff' | 'sniper' | 'vega') => `📻 ${pt.radio.speakers[speaker]}`;

export interface PushText {
  title: string;
  body: string;
}

export const esPush = {
  channel: "Avisos de radio",
  comeback: {
    1: (stage: string): PushText => ({ title: radio('sheriff'), body: `La fase ${stage} te espera. La horda no se detendrá sola.` }),
    3: (world: string): PushText => ({ title: radio('sniper'), body: `Llevas unos días fuera de la radio. ${world} todavía te necesita.` }),
    7: (stage: string): PushText => ({ title: radio('vega'), body: `Las esporas se extienden. Vuelve a la carretera: fase ${stage}.` }),
  },
  upgrade: (card: string, level: number): PushText => ({ title: "Mejora disponible", body: `Puedes mejorar ${card} al nivel ${level}. Ya tienes las monedas.` }),
  passRewards: (n: number): PushText => ({ title: "Premios del Pase", body: `${plural(n, "premio esperando", "premios esperando")} en el Pase de Batalla.` }),
  seasonEnd: (days: number, n: number): PushText => ({
    title: days === 1 ? "La temporada termina mañana" : "La temporada está terminando",
    body: `${days === 1 ? "Mañana" : `En ${days} días`} el Pase se reinicia. Tienes ${plural(n, "premio", "premios")} para reclamar.`,
  }),
  dailyReset: (): PushText => ({ title: "Un nuevo día en la carretera", body: "El XP del Pase y las monedas dobles han vuelto. ¿Jugamos?" }),
  survival: (best: number): PushText => ({ title: radio('sheriff'), body: `Llegaste a la oleada ${best} en Supervivencia. ¿Puedes con la ${best + 1}?` }),

  prompt: {
    title: "Avisos de radio",
    body: "¿Quieres avisos de radio sobre mejoras, premios del Pase o cuando la carretera te eche de menos? Como máximo uno al día, entre las 9 y las 21.",
    yes: "Quiero avisos",
    no: "Ahora no",
  },

  settings: {
    section: "Notificaciones",
    off: "Notificaciones desactivadas",
    offHint: "Actívalas para recibir avisos de radio.",
    enable: "Activar",
    openSystem: "Abrir",
    deniedHint: "Permite las notificaciones de Zombie Road en los ajustes del dispositivo.",
    progress: "Progreso",
    progressHint: "Vuelta a la carretera, mejoras y récords de Supervivencia.",
    pass: "Pase de Batalla",
    passHint: "Premios pendientes e inicio y fin de temporada.",
    shop: "Compras",
    shopHint: "Confirmación de compra y problemas de pago del Pase.",
    news: "Novedades",
    newsHint: "Nuevos mundos y eventos.",
  },
};
