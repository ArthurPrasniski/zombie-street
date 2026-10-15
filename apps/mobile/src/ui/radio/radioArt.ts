import type { Speaker } from '@/game/data/story';

/** Retratos do rádio (arte RPG detalhada, derivada pelo pipeline pixel16-detailed). */
export const RADIO_ART: Record<Speaker, number> = {
  sheriff: require('@/assets/pixel16-detailed/radio/sheriff.png'),
  sniper: require('@/assets/pixel16-detailed/radio/sniper.png'),
  vega: require('@/assets/pixel16-detailed/extras/vega.png'),
  static: require('@/assets/pixel16-detailed/extras/static.png'),
};

/** Cor do nome de quem fala. */
export const SPEAKER_COLORS: Record<Speaker, string> = { sheriff: '#ffc928', sniper: '#b8e835', vega: '#7fd0ff', static: '#a8a197' };
