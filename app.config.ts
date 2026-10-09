// Configuração dinâmica: parte do app.json e preenche o que depende de chaves (variáveis de
// ambiente; ver .env.example e docs/BACKEND.md). Sem as chaves, o build continua funcionando:
// o AdMob usa os IDs de teste do Google e o login do Google no iOS fica desligado.
import type { ConfigContext, ExpoConfig } from 'expo/config';

// IDs de aplicativo de TESTE do AdMob (documentação do Google): só mostram anúncios de teste.
const ADMOB_TEST_ANDROID = 'ca-app-pub-3940256099942544~3347511713';
const ADMOB_TEST_IOS = 'ca-app-pub-3940256099942544~1458506734';
const BUNDLE_ID = 'com.arthurprasniski.estradazumbi';

export default ({ config }: ConfigContext): ExpoConfig => {
  const env = process.env;
  const plugins: ExpoConfig['plugins'] = [
    ...(config.plugins ?? []),
    'expo-apple-authentication',
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: env.ADMOB_ANDROID_APP_ID ?? ADMOB_TEST_ANDROID,
        iosAppId: env.ADMOB_IOS_APP_ID ?? ADMOB_TEST_IOS,
        userTrackingUsageDescription: 'Usamos isso para mostrar propagandas mais relevantes quando você escolhe assistir uma para ganhar prêmios.',
      },
    ],
  ];
  // O login do Google no iOS precisa do "iOS URL scheme" (o client ID do iOS ao contrário)
  if (env.GOOGLE_IOS_URL_SCHEME) plugins.push(['@react-native-google-signin/google-signin', { iosUrlScheme: env.GOOGLE_IOS_URL_SCHEME }]);
  else plugins.push('@react-native-google-signin/google-signin');
  return {
    ...config,
    name: config.name ?? 'Zombie Road',
    slug: config.slug ?? 'estrada-zumbi',
    ios: { ...config.ios, bundleIdentifier: BUNDLE_ID, usesAppleSignIn: true },
    plugins,
  };
};
