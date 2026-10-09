import type { Speaker } from '@/game/data/story';

/** Retratos do rádio (gerados por scripts/art/portraits.mjs). */
export const RADIO_ART: Record<Speaker, number> = {
  sheriff: require('@/assets/images/radio/sheriff.png'),
  sniper: require('@/assets/images/radio/sniper.png'),
  vega: require('@/assets/images/radio/vega.png'),
  static: require('@/assets/images/radio/static.png'),
};

/** Cor do nome de quem fala. */
export const SPEAKER_COLORS: Record<Speaker, string> = { sheriff: '#ffc928', sniper: '#b8e835', vega: '#7fd0ff', static: '#a8a197' };
