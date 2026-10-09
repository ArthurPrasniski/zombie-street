// Gera os efeitos sonoros em assets/sounds. Uso: node scripts/audio/build.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { attack, decay, encodeWav, lowpass, mix, noiseSource, oscillator, render, saw, sine, square } from './synth.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = join(root, 'assets/sounds');

/** Tiro: estalo de ruído com corpo grave que cai rápido. */
function gunshot(seconds, body, crack, muffle, seed) {
  const noise = noiseSource(seed);
  const tone = oscillator(square);
  const shot = render(seconds, (t) => noise() * decay(t, crack) + tone(body * decay(t, 18)) * 0.5 * decay(t, 25));
  return lowpass(shot, muffle);
}

function explosion(seconds, rate, muffle, seed) {
  const noise = noiseSource(seed);
  const rumble = oscillator(sine);
  const boom = render(seconds, (t) => noise() * decay(t, rate) * attack(t, 0.005) + rumble(55 * decay(t, 3)) * 0.8 * decay(t, rate * 0.8));
  return lowpass(boom, muffle);
}

const SOUNDS = {
  rifle: () => gunshot(0.35, 140, 14, 0.55, 1),
  revolver: () => gunshot(0.2, 220, 24, 0.7, 2),
  shotgun: () => gunshot(0.45, 90, 9, 0.35, 3),
  machinegun: () => gunshot(0.09, 260, 45, 0.8, 4),
  chainsaw: () => {
    const motor = oscillator(saw);
    const noise = noiseSource(5);
    return lowpass(render(0.3, (t) => (motor(95 + 30 * square(t * 28)) * 0.7 + noise() * 0.3) * attack(t, 0.02) * decay(t, 4)), 0.5);
  },
  bark: () => {
    const voice = oscillator((p) => square(p, 0.3));
    const woof = (t0) => (t) => (t < t0 || t > t0 + 0.11 ? 0 : voice(420 * decay(t - t0, 6)) * decay(t - t0, 22));
    const a = woof(0);
    const b = woof(0.16);
    return lowpass(render(0.3, (t) => a(t) + b(t)), 0.45);
  },
  // Besta: estalo seco da corda e um zunido curto do virote
  bow: () => {
    const string = oscillator((p) => square(p, 0.2));
    const noise = noiseSource(13);
    return lowpass(render(0.22, (t) => string(180 * decay(t, 3)) * 0.6 * decay(t, 30) + noise() * 0.35 * attack(t, 0.01) * decay(t, 16)), 0.6);
  },
  explosion: () => explosion(0.8, 5, 0.25, 6),
  airstrike: () => explosion(1.4, 2.6, 0.18, 7),
  fire: () => {
    const noise = noiseSource(8);
    return lowpass(render(0.6, (t) => noise() * attack(t, 0.15) * decay(t, 3)), 0.3);
  },
  heal: () => {
    const bell = oscillator(sine);
    const notes = [523, 659, 784, 1046];
    return render(0.5, (t) => bell(notes[Math.min(3, Math.floor(t / 0.1))]) * decay(t % 0.1, 12) * 0.8);
  },
  deploy: () => {
    const noise = noiseSource(9);
    const thump = oscillator(sine);
    return lowpass(render(0.25, (t) => noise() * 0.5 * decay(t, 14) + thump(120 * decay(t, 8)) * decay(t, 10)), 0.4);
  },
  zombieDeath: () => {
    const groan = oscillator(saw);
    const noise = noiseSource(10);
    return lowpass(render(0.4, (t) => (groan(110 * decay(t, 2.5)) * 0.7 + noise() * 0.3 * decay(t, 20)) * decay(t, 6)), 0.3);
  },
  baseHit: () => {
    const thud = oscillator(sine);
    const noise = noiseSource(11);
    return lowpass(render(0.25, (t) => thud(80 * decay(t, 6)) * decay(t, 12) + noise() * 0.4 * decay(t, 30)), 0.4);
  },
  troopDown: () => {
    const tone = oscillator(square);
    return lowpass(render(0.45, (t) => tone(330 * decay(t, 2)) * decay(t, 5) * 0.6), 0.35);
  },
  boss: () => {
    const horn = oscillator(saw);
    const horn2 = oscillator(saw);
    return lowpass(render(1.2, (t) => (horn(65) + horn2(98)) * attack(t, 0.2) * decay(Math.max(0, t - 0.6), 4)), 0.15);
  },
  victory: () => {
    const lead = oscillator((p) => square(p, 0.25));
    const notes = [523, 659, 784, 1046, 1046];
    return lowpass(render(1.0, (t) => lead(notes[Math.min(4, Math.floor(t / 0.15))]) * (t < 0.6 ? decay(t % 0.15, 6) : decay(t - 0.6, 3)) * 0.6), 0.5);
  },
  defeat: () => {
    const lead = oscillator(square);
    const notes = [392, 349, 311, 262];
    return lowpass(render(1.2, (t) => lead(notes[Math.min(3, Math.floor(t / 0.25))]) * (t < 0.75 ? decay(t % 0.25, 4) : decay(t - 0.75, 2.5)) * 0.6), 0.35);
  },
  // Armas sci-fi (seção 18.4): estalo elétrico da Torre Tesla e o zumbido do rifle laser
  zap: () => {
    const noise = noiseSource(11);
    const buzz = oscillator(saw);
    return lowpass(render(0.28, (t) => (noise() * 0.6 * (square(t * 60) > 0 ? 1 : 0.3) + buzz(180 + 60 * square(t * 40)) * 0.4) * decay(t, 9)), 0.7);
  },
  laser: () => {
    const tone = oscillator(sine);
    return render(0.16, (t) => tone(1400 * decay(t, 9) + 300) * decay(t, 16) * 0.8);
  },
};

mkdirSync(outDir, { recursive: true });
for (const [name, make] of Object.entries(SOUNDS)) {
  const samples = mix(make());
  writeFileSync(join(outDir, `${name}.wav`), encodeWav(samples));
  console.log(`sounds/${name}.wav: ${(samples.length / 22050).toFixed(2)} s`);
}
