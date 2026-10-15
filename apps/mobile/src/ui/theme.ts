// Detailed RPG palette: dark steel panels, warm brass, readable olive highlights.
export const colors = {
  background: '#171b22',
  surface: '#252b32',
  surfaceHigh: '#343c42',
  line: '#555b59',
  text: '#f6eedb',
  textMuted: '#b5b4a7',
  ink: '#16141a',
  outline: '#17141b',
  accent: '#c3d875',
  featured: '#b85e36',
  teal: '#14605c',
  tealBright: '#1fa38f',
  mapCard: '#27466b',
  recordCard: '#5b1a26',
  yellow: '#dfb85e',
  gold: '#e5c77f',
  danger: '#ee7470',
  blood: '#d8263a',
  white: '#ffffff',
  // Cor de fundo das cartas por tipo
  troop: '#255d78',
  spell: '#9c3a24',
  // Véus escuros sobre a arte (modais, HUD, cartas sem sangue)
  veil: 'rgba(16, 20, 26, 0.84)',
};

export const radius = { s: 0, m: 2, l: 4, xl: 4 };

/** Light brass/olive controls need dark labels; steel and rust use light labels. */
export function textOnColor(hex:string):string {
  const value=parseInt(hex.slice(1,7),16);
  const channels=[16,8,0].map(shift=>{
    const c=((value>>shift)&255)/255;
    return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4);
  });
  return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722>.2?colors.ink:colors.text;
}

/** Cor da espessura embaixo das peças "gordinhas": a face escurecida. */
export function darkEdge(hex: string): string {
  const n = parseInt(hex.slice(1, 7), 16);
  const ch = (shift: number) => Math.round(((n >> shift) & 255) * 0.62);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}

export const fonts = {
  /** Títulos, botões e números (com contorno). */
  display: 'Rubik-Black',
  medium: 'Rubik-Medium',
  bold: 'Rubik-Bold',
  black: 'Rubik-Black',
};
