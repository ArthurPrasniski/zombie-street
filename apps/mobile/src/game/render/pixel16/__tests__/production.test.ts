import {t} from '@/i18n';
import {BESTIARY_ORDER,zombieWhere} from '@/ui/bestiary/zombieInfo';
import {TROOPS,CARD_IDS} from '@/game/data/cards';
import {ZOMBIES} from '@/game/data/zombies';
import {WORLDS} from '@/game/data/worlds';
import {DETAILED_CARD_ART,DETAILED_ZOMBIE_ART} from '@/ui/pixel16/productionPortraits';
import {WORLD_MODULES} from '@/assets/pixel16-detailed/modules';
import {drawFrame,drawBaseFrame} from '@/game/render/sprites';
import {DETAIL_LAYOUTS,FARM_BASE_LAYOUT,combatViewportHeight,detailedBaseFor} from '../production';
import type {SkCanvas,SkImage,SkPaint} from '@shopify/react-native-skia';
jest.mock('@shopify/react-native-skia',()=>({FilterMode:{Nearest:0,Linear:1},MipmapMode:{None:0},Skia:{XYWHRect:(x:number,y:number,width:number,height:number)=>({x,y,width,height})}}));
jest.mock('expo-asset',()=>({Asset:{}}));
const image={width:()=>1024,height:()=>384} as SkImage;
const paint={} as SkPaint;
function canvas(){return {save:jest.fn(),restore:jest.fn(),translate:jest.fn(),scale:jest.fn(),drawImageRectOptions:jest.fn()};}

test('campaign uses registered detailed atlas regions for walk, attack, corpse and mirrored views',()=>{
 expect(Object.keys(DETAIL_LAYOUTS).sort()).toEqual([...Object.keys(TROOPS),...Object.keys(ZOMBIES)].sort());
 for(const sheet of Object.values(DETAIL_LAYOUTS))for(let row=0;row<3;row++)for(const frame of [0,3,8,11,16,17,20]){
  const c=canvas();
  drawFrame(c as unknown as SkCanvas,image,frame,row,300.25,600.75,1.8,paint,true,sheet);
  const [,source,destination,filter]=c.drawImageRectOptions.mock.calls[0];
  expect(source.width).toBeGreaterThan(120);expect(source.width).toBeLessThanOrEqual(128);expect(source.height).toBe(128);
  expect(source.x+source.width).toBeLessThanOrEqual(1024);
  expect(source.y+source.height).toBeLessThanOrEqual(384);
  expect(Object.values(destination).every(Number.isFinite)).toBe(true);
  expect(filter).toBe(0);expect(c.scale).toHaveBeenCalledWith(-1,1);
  expect(c.save).toHaveBeenCalledTimes(1);expect(c.restore).toHaveBeenCalledTimes(1);
 }
});

test('classic developer comparison keeps its original atlas interpretation and filtering',()=>{
 const c=canvas();
 const classic={width:()=>6400,height:()=>768} as SkImage;
 drawFrame(c as unknown as SkCanvas,classic,20,2,300,500,1,paint);
 expect(c.drawImageRectOptions.mock.calls[0][1]).toEqual({x:5120,y:512,width:256,height:256});
 expect(c.drawImageRectOptions.mock.calls[0][3]).toBe(1);
});

test('detailed base keeps the wall at logical y780 and decoration outside the combat world',()=>{
 for(let frame=0;frame<4;frame++){
  const c=canvas();drawBaseFrame(c as unknown as SkCanvas,image,frame,paint,FARM_BASE_LAYOUT);
  const calls=c.drawImageRectOptions.mock.calls;
  expect(calls.length).toBeGreaterThan(2);
  const wall=calls.slice(0,-1).map(call=>call[2]);
  expect(wall.every(rect=>rect.y===780)).toBe(true);
  expect(wall.reduce((sum,rect)=>sum+rect.width,0)).toBeCloseTo(600);
  const base=calls.at(-1)![2];expect(base.y+base.height).toBeLessThanOrEqual(900.001);
 }
 expect(combatViewportHeight('farm')).toBe(1150);
 expect(combatViewportHeight('city')).toBe(1150);
 for(const world of WORLDS)expect(combatViewportHeight(world.id)).toBe(1150);
});


test('production covers every troop, enemy, card, bestiary portrait and campaign world',()=>{
 expect(Object.keys(DETAIL_LAYOUTS)).toHaveLength(45);
 expect(BESTIARY_ORDER).toHaveLength(30);
 expect(zombieWhere('larva')).toBe(t.bestiary.fromPod);
 expect([...BESTIARY_ORDER].sort()).toEqual(Object.keys(ZOMBIES).sort());
 expect(Object.keys(DETAILED_CARD_ART).sort()).toEqual([...CARD_IDS].sort());
 expect(Object.keys(DETAILED_ZOMBIE_ART).sort()).toEqual(Object.keys(ZOMBIES).sort());
 expect(Object.keys(WORLD_MODULES).sort()).toEqual(WORLDS.map(world=>world.id).sort());
 expect(Object.values(DETAILED_CARD_ART).every(Boolean)).toBe(true);
 expect(Object.values(DETAILED_ZOMBIE_ART).every(Boolean)).toBe(true);
});


test('armored and orbital campaign bases preserve all four damage states and the logical wall',()=>{
 expect(detailedBaseFor('farm').theme).toBe('farm');
 expect(detailedBaseFor('tech').theme).toBe('armored');
 expect(detailedBaseFor('moon').theme).toBe('space');
 for(const world of WORLDS){
  const base=detailedBaseFor(world.id);expect(base.image).toBeTruthy();
  expect(base.layout.frames).toHaveLength(4);
  for(let i=0;i<4;i++){
   const c=canvas();drawBaseFrame(c as unknown as SkCanvas,image,i,paint,base.layout);
   const draws=c.drawImageRectOptions.mock.calls;
   expect(draws.slice(0,-1).every(call=>call[2].y===780)).toBe(true);
   const rect=draws.at(-1)![2];expect(rect.y+rect.height).toBeLessThanOrEqual(900.001);
  }
 }
});
