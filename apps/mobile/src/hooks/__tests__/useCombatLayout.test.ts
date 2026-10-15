import { calculateCombatLayout } from '../useCombatLayout';
import { WORLD_HEIGHT } from '@/game/data/constants';

test.each([[402,874,34],[375,667,0],[360,640,24],[430,932,34],[768,1024,20]])('combat fills %s×%s with a safe hand and visible base', (width,height,bottom)=>{
 const layout=calculateCombatLayout(width,height,bottom);
 expect(layout.sceneW).toBe(width);
 expect(layout.sceneH+layout.stripH).toBe(height);
 expect(layout.stripH-bottom).toBeGreaterThanOrEqual(150);
 expect(WORLD_HEIGHT*layout.scaleY).toBeLessThanOrEqual(layout.sceneH+.001);
 expect(layout.cardWidth).toBeGreaterThan(40);
});

test('a tall phone keeps equal unit scales and crops only lower scenery',()=>{
 const layout=calculateCombatLayout(402,874,34);
 expect(layout.scaleY).toBe(402/600);
 expect(layout.sceneH/layout.scaleY).toBeGreaterThanOrEqual(900);
 expect(layout.sceneH/layout.scaleY).toBeLessThan(1150);
});
