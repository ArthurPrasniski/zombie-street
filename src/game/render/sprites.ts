import { FilterMode, MipmapMode, type SkCanvas, type SkImage, type SkPaint, Skia } from '@shopify/react-native-skia';
import { Asset } from 'expo-asset';
import { useEffect, useState } from 'react';

import layout from '@/game/render/spriteLayout.json';
import type { TroopId, WorldId, ZombieId } from '@/game/types';

export type UnitId = TroopId | ZombieId;

export interface SpriteSet {
  background: SkImage | null;
  base: SkImage | null;
  /** Só as unidades da partida (tropas do deck e zumbis do mundo); as outras ficam de fora. */
  units: Partial<Record<UnitId, SkImage>>;
}

/** Unidades do mundo por unidade de desenho (caixa de 100 unidades = 80 do mundo). */
export const ART_UNIT = layout.worldBox / layout.box;
const ROWS = Object.keys(layout.views).length;

export const SHEETS: Record<UnitId, number> = {
  sniper: require('@/assets/images/sprites/sniper.png'),
  sheriff: require('@/assets/images/sprites/sheriff.png'),
  shotgun: require('@/assets/images/sprites/shotgun.png'),
  chainsaw: require('@/assets/images/sprites/chainsaw.png'),
  dog: require('@/assets/images/sprites/dog.png'),
  barricade: require('@/assets/images/sprites/barricade.png'),
  soldier: require('@/assets/images/sprites/soldier.png'),
  firefighter: require('@/assets/images/sprites/firefighter.png'),
  medic: require('@/assets/images/sprites/medic.png'),
  crossbow: require('@/assets/images/sprites/crossbow.png'),
  turret: require('@/assets/images/sprites/turret.png'),
  drone: require('@/assets/images/sprites/drone.png'),
  tesla: require('@/assets/images/sprites/tesla.png'),
  laser: require('@/assets/images/sprites/laser.png'),
  titan: require('@/assets/images/sprites/titan.png'),
  walker: require('@/assets/images/sprites/walker.png'),
  runner: require('@/assets/images/sprites/runner.png'),
  brute: require('@/assets/images/sprites/brute.png'),
  cop: require('@/assets/images/sprites/cop.png'),
  riot: require('@/assets/images/sprites/riot.png'),
  bloater: require('@/assets/images/sprites/bloater.png'),
  hulk: require('@/assets/images/sprites/hulk.png'),
  grunt: require('@/assets/images/sprites/grunt.png'),
  general: require('@/assets/images/sprites/general.png'),
  frost: require('@/assets/images/sprites/frost.png'),
  yeti: require('@/assets/images/sprites/yeti.png'),
  spitter: require('@/assets/images/sprites/spitter.png'),
  digger: require('@/assets/images/sprites/digger.png'),
  splitter: require('@/assets/images/sprites/splitter.png'),
  splitling: require('@/assets/images/sprites/splitling.png'),
  shielder: require('@/assets/images/sprites/shielder.png'),
  android: require('@/assets/images/sprites/android.png'),
  mutant: require('@/assets/images/sprites/mutant.png'),
  astronaut: require('@/assets/images/sprites/astronaut.png'),
  colossus: require('@/assets/images/sprites/colossus.png'),
  director: require('@/assets/images/sprites/director.png'),
  padChief: require('@/assets/images/sprites/padChief.png'),
  cosmonaut: require('@/assets/images/sprites/cosmonaut.png'),
  xeno: require('@/assets/images/sprites/xeno.png'),
  pod: require('@/assets/images/sprites/pod.png'),
  larva: require('@/assets/images/sprites/larva.png'),
  commander: require('@/assets/images/sprites/commander.png'),
  lunarWorm: require('@/assets/images/sprites/lunarWorm.png'),
  marsTitan: require('@/assets/images/sprites/marsTitan.png'),
  queen: require('@/assets/images/sprites/queen.png'),
};

const BACKGROUNDS: Record<WorldId, number> = {
  farm: require('@/assets/images/worlds/farm.png'),
  city: require('@/assets/images/worlds/city.png'),
  swamp: require('@/assets/images/worlds/swamp.png'),
  desert: require('@/assets/images/worlds/desert.png'),
  snow: require('@/assets/images/worlds/snow.png'),
  tech: require('@/assets/images/worlds/tech.png'),
  lab: require('@/assets/images/worlds/lab.png'),
  launch: require('@/assets/images/worlds/launch.png'),
  station: require('@/assets/images/worlds/station.png'),
  moon: require('@/assets/images/worlds/moon.png'),
  mars: require('@/assets/images/worlds/mars.png'),
  hive: require('@/assets/images/worlds/hive.png'),
};

const BASES: Record<WorldId, number> = {
  farm: require('@/assets/images/worlds/farm-base.png'),
  city: require('@/assets/images/worlds/city-base.png'),
  swamp: require('@/assets/images/worlds/swamp-base.png'),
  desert: require('@/assets/images/worlds/desert-base.png'),
  snow: require('@/assets/images/worlds/snow-base.png'),
  tech: require('@/assets/images/worlds/tech-base.png'),
  lab: require('@/assets/images/worlds/lab-base.png'),
  launch: require('@/assets/images/worlds/launch-base.png'),
  station: require('@/assets/images/worlds/station-base.png'),
  moon: require('@/assets/images/worlds/moon-base.png'),
  mars: require('@/assets/images/worlds/mars-base.png'),
  hive: require('@/assets/images/worlds/hive-base.png'),
};

async function loadImage(module: number): Promise<SkImage | null> {
  const asset = Asset.fromModule(module);
  await asset.downloadAsync();
  const data = await Skia.Data.fromURI(asset.localUri ?? asset.uri);
  return Skia.Image.MakeImageFromEncoded(data);
}

const EMPTY: SpriteSet = { background: null, base: null, units: {} };

/**
 * Carrega o cenário e a base do mundo e as sheets das unidades da partida. Enquanto não
 * chegam, o render usa as formas provisórias.
 */
export function useSprites(world: WorldId, units: UnitId[]): SpriteSet {
  const [sprites, setSprites] = useState<SpriteSet>(EMPTY);
  const key = `${world}|${units.join(',')}`;
  useEffect(() => {
    let alive = true;
    const ids = key.split('|')[1].split(',') as UnitId[];
    Promise.all([loadImage(BACKGROUNDS[world]), loadImage(BASES[world]), ...ids.map((id) => loadImage(SHEETS[id]))]).then(([background, base, ...sheets]) => {
      if (!alive) return;
      const loaded: Partial<Record<UnitId, SkImage>> = {};
      ids.forEach((id, i) => {
        const image = sheets[i];
        if (image) loaded[id] = image;
      });
      setSprites({ background, base, units: loaded });
    });
    return () => {
      alive = false;
    };
  }, [key, world]);
  return sprites;
}

/**
 * Desenha um quadro da sheet com os pés em (x, y), suavizado (arte vetorial).
 * `row` é a linha da vista (frente, costas, perfil); `flip` espelha (perfil olhando para a esquerda).
 * O tamanho do quadro em pixels vem da própria imagem (o Brutamontes tem quadros maiores).
 */
export function drawFrame(canvas: SkCanvas, image: SkImage, frame: number, row: number, x: number, y: number, scale: number, paint: SkPaint, flip = false): void {
  'worklet';
  const px = image.height() / ROWS;
  const size = layout.box * ART_UNIT * scale;
  const src = Skia.XYWHRect(frame * px, row * px, px, px);
  const dst = Skia.XYWHRect(x - layout.footX * ART_UNIT * scale, y - layout.footY * ART_UNIT * scale, size, size);
  if (flip) {
    canvas.save();
    canvas.translate(x, 0);
    canvas.scale(-1, 1);
    canvas.translate(-x, 0);
  }
  canvas.drawImageRectOptions(image, src, dst, FilterMode.Linear, MipmapMode.None, paint);
  if (flip) canvas.restore();
}

/** Base: faixa da largura do campo, embaixo, com a frente do muro em BASE.frontY. */
export function drawBaseFrame(canvas: SkCanvas, image: SkImage, frame: number, paint: SkPaint): void {
  'worklet';
  const b = layout.base;
  const w = image.width() / b.frames;
  const src = Skia.XYWHRect(frame * w, 0, w, image.height());
  const dst = Skia.XYWHRect(0, b.y, b.width, b.height);
  canvas.drawImageRectOptions(image, src, dst, FilterMode.Linear, MipmapMode.None, paint);
}
