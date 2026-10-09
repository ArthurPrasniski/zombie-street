// Tema "asfalto e perigo": fundo grafite, destaque verde-limão tóxico, cartões em cores chapadas
// (laranja de pôr do sol, verde-petróleo, azul-aço, vinho) e botões amarelos de faixa de estrada.
export const colors = {
  background: '#16141a',
  surface: '#221f27',
  surfaceHigh: '#2e2a34',
  line: '#3d3844',
  text: '#f7f2e8',
  textMuted: '#a8a197',
  ink: '#16141a',
  outline: '#17141b',
  accent: '#b8e835',
  featured: '#e8572a',
  teal: '#14605c',
  tealBright: '#1fa38f',
  mapCard: '#27466b',
  recordCard: '#5b1a26',
  yellow: '#ffc928',
  gold: '#ffc93c',
  danger: '#ff4f4f',
  blood: '#d8263a',
  white: '#ffffff',
  // Cor de fundo das cartas por tipo
  troop: '#255d78',
  spell: '#9c3a24',
  // Véus escuros sobre a arte (modais, HUD, cartas sem sangue)
  veil: 'rgba(22, 20, 26, 0.78)',
};

export const radius = { s: 10, m: 16, l: 24, xl: 30 };

/** Cor da espessura embaixo das peças "gordinhas": a face escurecida. */
export function darkEdge(hex: string): string {
  const n = parseInt(hex.slice(1, 7), 16);
  const ch = (shift: number) => Math.round(((n >> shift) & 255) * 0.62);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}

export const fonts = {
  /** Títulos, botões e números (com contorno). */
  display: 'LilitaOne-Regular',
  medium: 'Rubik-Medium',
  bold: 'Rubik-Bold',
  black: 'Rubik-Black',
};
