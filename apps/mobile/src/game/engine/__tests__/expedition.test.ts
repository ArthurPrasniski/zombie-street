import { createWorld, createTroop } from '../world';
import { survivalStage } from '@/game/data/survival';
import { STARTER_DECK, TROOPS } from '@/game/data/cards';
import { initialProgress } from '@/state/progress';
import { chooseBoon, offerBoons } from '../expedition';
import { applyCommands } from '../commands';
test('vantagens ficam na partida e são escolhidas uma única vez por oferta', () => {
 const p = initialProgress(); const world = createWorld(survivalStage(), { deck: STARTER_DECK, cardLevels: p.cardLevels, expedition: true },1,'survival');
 offerBoons(world); expect(world.paused).toBe(true); world.commands.push({ type: 'setPaused', paused: false }); applyCommands(world); expect(world.paused).toBe(true);
 world.expedition!.choices = ['attack','blood','repair'];
 const before = createTroop(world,TROOPS.sniper,1,300,700).damage;
 expect(chooseBoon(world,'attack')).toBe(true); expect(chooseBoon(world,'attack')).toBe(false);
 expect(createTroop(world,TROOPS.sniper,1,300,700).damage).toBeCloseTo(before * 1.1);
 expect(world.paused).toBe(false); expect(p.cardLevels.sniper).toBe(1);
 const next = createWorld(survivalStage(), { deck: STARTER_DECK, cardLevels: p.cardLevels, expedition: true }); expect(next.expedition!.picked).toEqual([]);
});
