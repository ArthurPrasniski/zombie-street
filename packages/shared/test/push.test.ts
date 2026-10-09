import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEFAULT_PUSH_PREFS, isAppRoute, isQuietHour, PUSH_CATEGORIES, PUSH_CATEGORY, PUSH_ROUTE, pushData } from '../src/push';

describe('notificações (GDD seção 20)', () => {
  it('só entre 9h e 21h', () => {
    assert.equal(isQuietHour(8), true);
    assert.equal(isQuietHour(9), false);
    assert.equal(isQuietHour(20), false);
    assert.equal(isQuietHour(21), true);
    assert.equal(isQuietHour(0), true);
  });

  it('todo aviso tem categoria conhecida e abre uma rota do app', () => {
    for (const [kind, category] of Object.entries(PUSH_CATEGORY)) {
      assert.ok(PUSH_CATEGORIES.includes(category), kind);
      assert.ok(isAppRoute(PUSH_ROUTE[kind as keyof typeof PUSH_ROUTE]), kind);
    }
    assert.deepEqual(pushData('upgrade'), { kind: 'upgrade', url: '/deck' });
    assert.ok(PUSH_CATEGORIES.every((c) => DEFAULT_PUSH_PREFS[c]));
  });

  it('rota de aviso remoto: só caminhos do app', () => {
    assert.equal(isAppRoute('/combat?mode=survival'), true);
    assert.equal(isAppRoute('https://site.com'), false);
    assert.equal(isAppRoute('//site.com'), false);
    assert.equal(isAppRoute(42), false);
  });
});
