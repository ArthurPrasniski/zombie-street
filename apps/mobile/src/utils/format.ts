const SUFFIXES = ['', 'K', 'M', 'B', 'T'];

/** 999 -> "999", 1234 -> "1.2K", 3400000 -> "3.4M". Trunca para nunca mostrar mais do que existe. */
export function formatCash(value: number): string {
  const v = Math.floor(value);
  let tier = 0;
  while (tier < SUFFIXES.length - 1 && v >= 1000 ** (tier + 1)) tier++;
  if (tier === 0) return String(v);
  const tenths = Math.floor(v / (1000 ** tier / 10));
  return `${tenths / 10}${SUFFIXES[tier]}`;
}

/** Inteiro com ponto de milhar: 1150 -> "1.150", 12000 -> "12.000". */
export function formatInt(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** 45 -> "45 s", 754 -> "12 min", 5400 -> "1 h 30 min". */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) return `${s} s`;
  const totalMinutes = Math.floor(s / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}
