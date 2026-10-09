import { cardPower } from '@/game/data/balance';
import { CARD_UNLOCKS, SPELLS } from '@/game/data/cards';
import { EVOLUTIONS } from '@/game/data/evolutions';
import { playCard } from '@/game/engine/cards';
import { distance } from '@/game/engine/queries';

import { addZombie, fightingWorld, giveCard, simulate } from './helpers';

const lost = (z: { hp: number; maxHp: number }) => z.maxHp - z.hp;
const cast = (card: 'cryo' | 'forcefield' | 'blackhole' | 'orbital', x: number, y: number, level = 1) => {
  const world = fightingWorld();
  world.base.damage = 0;
  world.cardLevels = { ...world.cardLevels, [card]: level };
  world.blood = 10;
  giveCard(world, card);
  return { world, play: () => playCard(world, 0, x, y) };
};

describe('armas especiais do Ato 3 (seção 18.4)', () => {
  it('liberam nas fases 84, 92, 103 e 112', () => {
    expect([CARD_UNLOCKS.cryo, CARD_UNLOCKS.forcefield, CARD_UNLOCKS.blackhole, CARD_UNLOCKS.orbital]).toEqual([84, 92, 103, 112]);
  });

  it('Criogenia: dano, congela 2 s e deixa lento depois', () => {
    const { world, play } = cast('cryo', 300, 300);
    const z = addZombie(world, 'brute', 300, 300);
    play();
    expect(lost(z)).toBeCloseTo(SPELLS.cryo.damage!);
    expect(z.stun).toBe(SPELLS.cryo.freeze);
    expect(z.slowTimer).toBeGreaterThan(z.stun);
    const y = z.y;
    simulate(world, 1);
    expect(z.y).toBe(y);
  });

  it('Escudo de Energia: segura os zumbis até quebrar', () => {
    const { world, play } = cast('forcefield', 300, 500);
    play();
    const z = addZombie(world, 'walker', 300, 440);
    simulate(world, 3);
    expect(z.y).toBeLessThan(520);
    const field = world.areas.find((a) => a.kind === 'forcefield')!;
    expect(field.kind === 'forcefield' && field.hp).toBeLessThan(SPELLS.forcefield.wallHp!);
    if (field.kind === 'forcefield') field.hp = 0;
    simulate(world, 3);
    expect(world.areas.some((a) => a.kind === 'forcefield')).toBe(false);
    expect(z.y).toBeGreaterThan(520);
  });

  it('Buraco Negro: puxa para o centro e esmaga no fim; o chefe não é puxado', () => {
    const { world, play } = cast('blackhole', 300, 300);
    const z = addZombie(world, 'walker', 400, 300);
    z.def = { ...z.def, speed: 0 };
    const boss = addZombie(world, 'brute', 220, 300);
    boss.def = { ...boss.def, speed: 0 };
    play();
    simulate(world, 1);
    expect(distance(z.x, z.y, 300, 300)).toBeLessThan(40);
    expect(boss.x).toBe(220);
    simulate(world, SPELLS.blackhole.duration!);
    expect(world.zombies.includes(z)).toBe(false);
  });

  it('Canhão Orbital: depois de 1 s, acerta a coluna inteira e só ela', () => {
    const { world, play } = cast('orbital', 300, 400);
    const top = addZombie(world, 'brute', 310, 50);
    const bottom = addZombie(world, 'brute', 290, 700);
    const aside = addZombie(world, 'brute', 450, 400);
    for (const z of [top, bottom, aside]) z.def = { ...z.def, speed: 0 };
    play();
    simulate(world, 0.9);
    expect(lost(top)).toBe(0);
    simulate(world, 0.2);
    expect(lost(top)).toBeCloseTo(SPELLS.orbital.damage! - (top.def.armor ?? 0), 0);
    expect(lost(bottom)).toBeGreaterThan(0);
    expect(aside.hp).toBe(aside.maxHp);
  });

  it('evoluções: Criogenia congela mais, Escudo com mais vida, Canhão cai antes', () => {
    const c = cast('cryo', 300, 300, 10);
    const z = addZombie(c.world, 'brute', 300, 300);
    c.play();
    expect(z.stun).toBe(SPELLS.cryo.freeze! + EVOLUTIONS.cryo[0]);
    const f = cast('forcefield', 300, 500, 20);
    f.play();
    expect(f.world.areas[0]).toMatchObject({ maxHp: SPELLS.forcefield.wallHp! * cardPower(20) * (1 + EVOLUTIONS.forcefield[1]) });
    const o = cast('orbital', 300, 400, 20);
    o.play();
    expect(o.world.areas[0]).toMatchObject({ delay: EVOLUTIONS.orbital[1] });
  });
});
