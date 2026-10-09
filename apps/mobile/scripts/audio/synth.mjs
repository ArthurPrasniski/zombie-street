// Sintetizador simples de efeitos em 8 bits (estilo sfxr): ondas, ruído, envelopes e filtro.
export const RATE = 22050;

/** Gera `seconds` de áudio chamando fn(t) para cada amostra. */
export function render(seconds, fn) {
  const out = new Float32Array(Math.round(seconds * RATE));
  for (let i = 0; i < out.length; i++) out[i] = fn(i / RATE, i);
  return out;
}

// Ruído determinístico (LCG), para os sons saírem iguais a cada build.
export function noiseSource(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return (s / 4294967296) * 2 - 1;
  };
}

export const square = (phase, duty = 0.5) => ((phase % 1) < duty ? 1 : -1);
export const saw = (phase) => 2 * (phase % 1) - 1;
export const sine = (phase) => Math.sin(phase * Math.PI * 2);
export const decay = (t, rate) => Math.exp(-t * rate);
export const attack = (t, time) => Math.min(1, t / time);

/** Oscilador com frequência variável: integra a fase amostra a amostra. */
export function oscillator(wave) {
  let phase = 0;
  return (freq) => {
    phase += freq / RATE;
    return wave(phase);
  };
}

/** Filtro passa-baixa de um polo (0 < k < 1; menor = mais abafado). */
export function lowpass(samples, k) {
  let y = 0;
  return samples.map((x) => (y += k * (x - y)));
}

export function mix(...tracks) {
  const len = Math.max(...tracks.map((t) => t.length));
  const out = new Float32Array(len);
  for (const t of tracks) for (let i = 0; i < t.length; i++) out[i] += t[i];
  return out;
}

/** Ajusta o pico para `peak` e codifica como WAV PCM 16 bits mono. */
export function encodeWav(samples, peak = 0.9) {
  const max = samples.reduce((m, v) => Math.max(m, Math.abs(v)), 1e-6);
  const gain = peak / max;
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v * gain)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}
