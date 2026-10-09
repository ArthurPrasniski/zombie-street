import { DEFAULT_PUSH_PREFS } from '@zombie-road/shared/push';

import { type PlanInput, planLocalPushes, slotTime } from '@/services/push/plan';

// Datas em hora local (o plano usa o relógio do aparelho): 9 de outubro de 2026, 14h30
const NOW = new Date(2026, 9, 9, 14, 30);

const input = (over: Partial<PlanInput> = {}): PlanInput => ({
  now: NOW,
  prefs: DEFAULT_PUSH_PREFS,
  stage: '2-4',
  world: 'Cidade em ruínas',
  upgrade: null,
  passClaimable: 0,
  seasonEnd: null,
  maxedToday: false,
  survivalBest: 0,
  ...over,
});

const summary = (over: Partial<PlanInput> = {}) => planLocalPushes(input(over)).map((p) => `${p.at.getDate()}/${p.at.getHours()}h ${p.kind}`);

describe('avisos locais (GDD seção 20.1)', () => {
  it('sem novidade: o rádio chama de volta em 1, 3 e 7 dias, no mesmo horário', () => {
    expect(summary()).toEqual(['10/14h comeback', '12/14h comeback', '16/14h comeback']);
    const [first] = planLocalPushes(input());
    expect(first.body).toContain('2-4');
    expect(first.title).toContain('Xerife');
  });

  it('só entre 9h e 21h: de madrugada vira 9h, de noite vira 20h do mesmo dia', () => {
    expect(slotTime(new Date(2026, 9, 9, 3, 0), 1).getHours()).toBe(9);
    const late = slotTime(new Date(2026, 9, 9, 23, 40), 1);
    expect([late.getDate(), late.getHours()]).toEqual([10, 20]);
    expect(summary({ now: new Date(2026, 9, 9, 22, 0) })).toEqual(['10/20h comeback', '12/20h comeback', '16/20h comeback']);
  });

  it('prêmios do passe e melhoria tomam os dias 1 e 2', () => {
    const plan = planLocalPushes(input({ passClaimable: 3, upgrade: { card: 'Lara', level: 9 } }));
    expect(plan.map((p) => p.kind)).toEqual(['passRewards', 'upgrade', 'comeback', 'comeback']);
    expect(plan[0].body).toBe('3 prêmios esperando no Passe de Batalha.');
    expect(plan[1].body).toContain('Lara para o nível 9');
  });

  it('dia novo (bateu o teto ontem) e recorde da Sobrevivência no lugar do 3º dia', () => {
    expect(summary({ maxedToday: true, survivalBest: 23 })).toEqual(['10/14h dailyReset', '12/14h survival', '16/14h comeback']);
    expect(planLocalPushes(input({ survivalBest: 23 }))[1].body).toContain('onda 23');
  });

  it('fim da temporada: 3 dias e 1 dia antes, às 18h, só com prêmio pendente', () => {
    const seasonEnd = new Date(2026, 9, 14, 21, 0);
    const plan = summary({ passClaimable: 2, seasonEnd });
    expect(plan).toEqual(['10/14h passRewards', '11/18h seasonEnd', '12/14h comeback', '13/18h seasonEnd', '16/14h comeback']);
    expect(summary({ seasonEnd })).not.toContain('11/18h seasonEnd');
  });

  it('um aviso por dia: o fim da temporada vence no mesmo dia', () => {
    const plan = planLocalPushes(input({ passClaimable: 1, seasonEnd: new Date(2026, 9, 11, 21, 0) }));
    const days = plan.map((p) => p.at.toDateString());
    expect(new Set(days).size).toBe(days.length);
    expect(plan[0]).toMatchObject({ kind: 'seasonEnd', title: 'A temporada acaba amanhã' });
  });

  it('respeita as categorias desligadas e não agenda nada na próxima hora', () => {
    const off = { ...DEFAULT_PUSH_PREFS, progress: false };
    expect(summary({ prefs: off, passClaimable: 2, upgrade: { card: 'Lara', level: 9 }, maxedToday: true })).toEqual(['10/14h passRewards']);
    expect(summary({ prefs: { progress: false, pass: false, shop: true, news: true }, passClaimable: 2 })).toEqual([]);
    // São 17h30 e a temporada acaba amanhã: o aviso das 18h de hoje ficaria perto demais
    const evening = new Date(2026, 9, 9, 17, 30);
    expect(summary({ now: evening, prefs: off, passClaimable: 1, seasonEnd: new Date(2026, 9, 10, 21, 0) })).toEqual(['10/17h passRewards']);
    expect(summary({ prefs: off, passClaimable: 1, seasonEnd: new Date(2026, 9, 10, 21, 0) })).toEqual(['9/18h seasonEnd', '10/14h passRewards']);
  });
});
