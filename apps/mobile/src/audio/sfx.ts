import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';

import type { CardId, GameEvent, TroopId } from '@/game/types';
import { useSettingsStore } from '@/state/settingsStore';

const SOURCES = {
  rifle: require('@/assets/sounds/rifle.wav'),
  revolver: require('@/assets/sounds/revolver.wav'),
  shotgun: require('@/assets/sounds/shotgun.wav'),
  machinegun: require('@/assets/sounds/machinegun.wav'),
  bow: require('@/assets/sounds/bow.wav'),
  chainsaw: require('@/assets/sounds/chainsaw.wav'),
  bark: require('@/assets/sounds/bark.wav'),
  explosion: require('@/assets/sounds/explosion.wav'),
  airstrike: require('@/assets/sounds/airstrike.wav'),
  fire: require('@/assets/sounds/fire.wav'),
  heal: require('@/assets/sounds/heal.wav'),
  deploy: require('@/assets/sounds/deploy.wav'),
  zombieDeath: require('@/assets/sounds/zombieDeath.wav'),
  baseHit: require('@/assets/sounds/baseHit.wav'),
  troopDown: require('@/assets/sounds/troopDown.wav'),
  boss: require('@/assets/sounds/boss.wav'),
  victory: require('@/assets/sounds/victory.wav'),
  defeat: require('@/assets/sounds/defeat.wav'),
  zap: require('@/assets/sounds/zap.wav'),
  laser: require('@/assets/sounds/laser.wav'),
};
type SoundId = keyof typeof SOURCES;

// Sons que se sobrepõem ganham mais de um player (no máximo 4 tiros ao mesmo tempo).
const POOL: Partial<Record<SoundId, number>> = { machinegun: 2, revolver: 2, rifle: 2, shotgun: 2, zombieDeath: 3, explosion: 2, chainsaw: 2, bark: 2 };
// Intervalo mínimo entre repetições do mesmo som (ms), para não virar ruído.
const MIN_GAP: Partial<Record<SoundId, number>> = { machinegun: 90, zombieDeath: 90, baseHit: 160, revolver: 60, chainsaw: 120, bark: 150, fire: 350, heal: 500, zap: 200, laser: 90 };
const VOLUME: Partial<Record<SoundId, number>> = { machinegun: 0.35, zombieDeath: 0.5, baseHit: 0.7, deploy: 0.7, chainsaw: 0.6, laser: 0.4, zap: 0.6 };
const MAX_GUNSHOTS = 4;
const GUNSHOT_WINDOW = 120;
const GUNSHOTS: SoundId[] = ['rifle', 'revolver', 'shotgun', 'machinegun'];
const HAPTIC_GAP = 350;

const ATTACK_SOUND: Record<TroopId | 'base', SoundId | null> = {
  sniper: 'rifle',
  sheriff: 'revolver',
  shotgun: 'shotgun',
  chainsaw: 'chainsaw',
  dog: 'bark',
  barricade: null,
  soldier: 'machinegun',
  firefighter: 'fire',
  medic: 'heal',
  crossbow: 'bow',
  turret: 'machinegun',
  drone: 'machinegun',
  tesla: 'zap',
  laser: 'laser',
  titan: 'baseHit',
  base: 'machinegun',
};
const CARD_SOUND: Partial<Record<CardId, SoundId>> = { medkit: 'heal', molotov: 'fire' };

let players: Record<SoundId, AudioPlayer[]> | null = null;
const nextIndex: Partial<Record<SoundId, number>> = {};
const lastPlayed: Partial<Record<SoundId, number>> = {};
let recentShots: number[] = [];
let lastHaptic = 0;

/** Carrega todos os sons uma vez (ao entrar no combate). */
export function loadSfx(): void {
  if (players) return;
  setAudioModeAsync({ playsInSilentMode: false }).catch(() => {});
  const entries = (Object.keys(SOURCES) as SoundId[]).map((id) => {
    const pool = Array.from({ length: POOL[id] ?? 1 }, () => createAudioPlayer(SOURCES[id]));
    return [id, pool] as const;
  });
  players = Object.fromEntries(entries) as Record<SoundId, AudioPlayer[]>;
}

export function unloadSfx(): void {
  if (!players) return;
  for (const pool of Object.values(players)) for (const player of pool) player.remove();
  players = null;
}

export function playSound(id: SoundId): void {
  if (!players || !useSettingsStore.getState().sound) return;
  const now = Date.now();
  if (now - (lastPlayed[id] ?? 0) < (MIN_GAP[id] ?? 0)) return;
  if (GUNSHOTS.includes(id)) {
    recentShots = recentShots.filter((t) => now - t < GUNSHOT_WINDOW);
    if (recentShots.length >= MAX_GUNSHOTS) return;
    recentShots.push(now);
  }
  lastPlayed[id] = now;
  const pool = players[id];
  const index = (nextIndex[id] ?? 0) % pool.length;
  nextIndex[id] = index + 1;
  const player = pool[index];
  player.volume = VOLUME[id] ?? 1;
  player.seekTo(0).catch(() => {});
  player.play();
}

function vibrate(style: Haptics.ImpactFeedbackStyle, throttle = true): void {
  if (!useSettingsStore.getState().haptics) return;
  const now = Date.now();
  if (throttle && now - lastHaptic < HAPTIC_GAP) return;
  lastHaptic = now;
  Haptics.impactAsync(style).catch(() => {});
}

function notify(type: Haptics.NotificationFeedbackType): void {
  if (useSettingsStore.getState().haptics) Haptics.notificationAsync(type).catch(() => {});
}

/** Vibração das animações de recompensa (estrela, nível novo, prêmio), respeitando os Ajustes. */
export function rewardHaptic(strong = false): void {
  if (strong) notify(Haptics.NotificationFeedbackType.Success);
  else vibrate(Haptics.ImpactFeedbackStyle.Light, false);
}

/** Som e vibração de cada evento do motor (GDD seção 13). */
export function playEvent(event: GameEvent): void {
  switch (event.type) {
    case 'attack': {
      const sound = ATTACK_SOUND[event.source];
      if (sound) playSound(sound);
      return;
    }
    case 'cardPlayed':
      playSound(CARD_SOUND[event.card] ?? 'deploy');
      return;
    case 'explosion':
      playSound(event.big ? 'airstrike' : 'explosion');
      vibrate(event.big ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium, false);
      return;
    case 'zombieKilled':
      playSound('zombieDeath');
      return;
    case 'baseHit':
      playSound('baseHit');
      vibrate(Haptics.ImpactFeedbackStyle.Light);
      return;
    case 'troopDown':
      playSound('troopDown');
      return;
    case 'scenarioEvent':
      playSound('boss');
      notify(Haptics.NotificationFeedbackType.Warning);
      return;
    case 'bossSpawned':
      playSound('boss');
      vibrate(Haptics.ImpactFeedbackStyle.Heavy, false);
      return;
    case 'stageCleared':
      playSound('victory');
      notify(Haptics.NotificationFeedbackType.Success);
      return;
    case 'stageFailed':
      playSound('defeat');
      notify(Haptics.NotificationFeedbackType.Error);
      return;
    case 'waveStarted':
      return;
  }
}
