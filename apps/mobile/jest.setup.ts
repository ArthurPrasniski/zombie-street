jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageTag: 'pt-BR', languageCode: 'pt', regionCode: 'BR' }]),
}));
