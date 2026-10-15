import { COMBAT_VIEWPORT_HEIGHT, COMBAT_HUD_HEIGHT, TRAY_TOP, TRAY_BOTTOM, TRAY_GAP, calculateCombatLayout } from '../useCombatLayout';
import { WORLD_HEIGHT } from '@/game/data/constants';

test.each([[402,874,34],[375,667,0],[360,640,24],[430,932,34],[768,1024,20]])('combat fills %s×%s with a safe hand and visible base', (width,height,bottom)=>{
 const layout=calculateCombatLayout(width,height,bottom);
 expect(layout.sceneW).toBe(width);
 expect(layout.sceneH+layout.stripH).toBe(height);
 expect(layout.stripH-bottom).toBeGreaterThanOrEqual(202);
 expect(TRAY_TOP+COMBAT_HUD_HEIGHT+TRAY_GAP*2+Math.round(layout.cardWidth*1.32)+46+TRAY_BOTTOM+1).toBeLessThanOrEqual(layout.stripH-bottom);
 expect(COMBAT_VIEWPORT_HEIGHT*layout.scaleY).toBeLessThanOrEqual(layout.sceneH+.001);
 expect(WORLD_HEIGHT*layout.scaleY).toBeLessThanOrEqual(layout.sceneH+.001);
 expect(layout.cardWidth).toBeGreaterThan(40);
});

test('the full lower scenery fits while the map continues to fill both sides',()=>{
 const layout=calculateCombatLayout(402,874,34);
 expect(layout.sceneW).toBe(402);
 expect(layout.scaleY).toBeCloseTo(layout.sceneH/COMBAT_VIEWPORT_HEIGHT);
 expect(layout.sceneH/layout.scaleY).toBeGreaterThanOrEqual(COMBAT_VIEWPORT_HEIGHT-.001);
});
