const now = new Date(2026, 9, 13, 12).getTime();
const iso = (minutes: number) => new Date(now - minutes * 60000).toISOString();

describe('horário da sincronização sem Intl.RelativeTimeFormat (Hermes)', () => {
  const descriptor = Object.getOwnPropertyDescriptor(Intl, 'RelativeTimeFormat');
  beforeAll(() => Object.defineProperty(Intl, 'RelativeTimeFormat', { configurable: true, value: undefined }));
  afterAll(() => {
    if (descriptor) Object.defineProperty(Intl, 'RelativeTimeFormat', descriptor);
    else Reflect.deleteProperty(Intl, 'RelativeTimeFormat');
  });

  test.each([
    ['pt-BR', 'agora', 'há 5 min'],
    ['en-US', 'now', '5 min ago'],
    ['es-MX', 'ahora', 'hace 5 min'],
  ])('formata sincronização recente em %s sem falhar', (languageTag, justNow, minutesAgo) => {
    jest.resetModules();
    jest.requireMock('expo-localization').getLocales.mockReturnValue([{ languageTag }]);
    const { formatSyncTime } = jest.requireActual<typeof import('../syncTime')>('../syncTime');
    expect(formatSyncTime(iso(0), now)).toBe(justNow);
    expect(formatSyncTime(iso(-1), now)).toBe(justNow);
    expect(formatSyncTime(iso(5), now)).toBe(minutesAgo);
    expect(formatSyncTime(null, now)).toBeNull();
    expect(formatSyncTime('invalid', now)).toBeNull();
  });

  test('mostra a data quando passou uma hora', () => {
    jest.resetModules();
    jest.requireMock('expo-localization').getLocales.mockReturnValue([{ languageTag: 'pt-BR' }]);
    const { formatSyncTime } = jest.requireActual<typeof import('../syncTime')>('../syncTime');
    expect(formatSyncTime(iso(60), now)).toBe('13/10/2026');
  });
});
