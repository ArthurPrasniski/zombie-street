import { languageFor } from '../locale';

let mockLocales: jest.Mock;
beforeEach(() => {
  jest.resetModules();
  mockLocales = jest.requireMock('expo-localization').getLocales;
  mockLocales.mockReturnValue([{ languageTag: 'pt-BR', languageCode: 'pt', regionCode: 'BR' }]);
});

test.each([
  ['pt-BR', 'pt'], ['pt-PT', 'pt'], ['en-GB', 'en'], ['es-MX', 'es'], ['es-ES', 'es'], ['ja-JP', 'en'],
])('seleciona %s como %s', (languageTag, expected) => {
  expect(languageFor([{ languageTag }])).toBe(expected);
});

test('respeita a ordem dos idiomas preferidos e usa a primeira opção suportada', () => {
  expect(languageFor([{ languageTag: 'fr-FR' }, { languageTag: 'es-AR' }, { languageTag: 'pt-BR' }])).toBe('es');
  expect(languageFor([])).toBe('en');
});

test.each([
  ['pt-BR', 'Loja', 'Passe de Batalha', 'Fazenda', '1.234'],
  ['en-US', 'Shop', 'Battle Pass', 'Farm', '1,234'],
  ['es-MX', 'Tienda', 'Pase de Batalla', 'Granja', '1,234'],
])('localiza interface, história e números em %s', (languageTag, shop, pass, world, number) => {
  mockLocales.mockReturnValue([{ languageTag }]);
  const { t } = jest.requireActual<typeof import('../index')>('../index');
  const { localizedName } = jest.requireActual<typeof import('../names')>('../names');
  const { formatInt } = jest.requireActual<typeof import('../../utils/format')>('../../utils/format');
  expect(t.shop.title).toBe(shop);
  expect(t.pass.title).toBe(pass);
  expect(localizedName('Fazenda')).toBe(world);
  expect(formatInt(1234)).toBe(number);
  expect(t.radio.messages['w1-intro']).toHaveLength(3);
  if (languageTag !== 'pt-BR') expect(t.radio.messages['w1-intro'][0].text).not.toContain('Aqui é o Xerife');
});

test('formata preços e datas brasileiros sem alterar a moeda recebida', () => {
  const { formatMoney, formatDate } = jest.requireActual<typeof import('../../utils/format')>('../../utils/format');
  expect(formatMoney(19.9, 'BRL').replace(/\s/g, ' ')).toBe('R$ 19,90');
  expect(formatMoney(3.99, 'USD')).not.toContain('R$');
  expect(formatDate(new Date(2026, 9, 13, 12))).toBe('13/10/2026');
});

test('todos os idiomas têm as mesmas chaves de tradução', () => {
  const { dictionaries } = jest.requireActual<typeof import('../index')>('../index');
  const keys = (obj: object, prefix = ''): string[] => Object.entries(obj).flatMap(([key, value]) => {
    const path = `${prefix}.${key}`;
    return value && typeof value === 'object' ? keys(value, path) : [path];
  }).sort();
  expect(keys(dictionaries.en)).toEqual(keys(dictionaries.pt));
  expect(keys(dictionaries.es)).toEqual(keys(dictionaries.pt));
});
