// Configuração dinâmica: parte do app.json e preenche o que depende de chaves (variáveis de
// ambiente; ver .env.example e docs/BACKEND.md). Sem as chaves, o build continua funcionando:
// o AdMob usa os IDs de teste do Google, o login do Google no iOS fica desligado e o Android não
// recebe push remoto (precisa do google-services.json do Firebase; os avisos locais funcionam).
import type { ConfigContext, ExpoConfig } from 'expo/config';

// IDs de aplicativo de TESTE do AdMob (documentação do Google): só mostram anúncios de teste.
const ADMOB_TEST_ANDROID = 'ca-app-pub-3940256099942544~3347511713';
const ADMOB_TEST_IOS = 'ca-app-pub-3940256099942544~1458506734';
const BUNDLE_ID = 'com.arthurprasniski.estradazumbi';
// Cor de destaque do app (verde-limão do tema) no ícone das notificações do Android
const NOTIFICATION_COLOR = '#b8e835';

export default ({ config }: ConfigContext): ExpoConfig => {
  const env = process.env;
  const plugins: ExpoConfig['plugins'] = [
    ...(config.plugins ?? []),
    'expo-apple-authentication',
    // Push no iOS: ambiente "production" só no build da loja (perfil production do EAS)
    ['expo-notifications', { icon: './assets/images/notification-icon.png', color: NOTIFICATION_COLOR, mode: env.EAS_BUILD_PROFILE === 'production' ? 'production' : 'development' }],
    [
      'react-native-google-mobile-ads',
      {
        // `||`: a variável vazia (copiada do .env.example) também usa o ID de teste
        androidAppId: env.ADMOB_ANDROID_APP_ID || ADMOB_TEST_ANDROID,
        iosAppId: env.ADMOB_IOS_APP_ID || ADMOB_TEST_IOS,
        // SDK padrão, explícito de propósito: sem essa opção, o Gradle da biblioteca (17.2) acha o
        // app.json sem a chave "react-native-google-mobile-ads", grava a propriedade com o nome
        // errado (googleAdsJson) e o build Android quebra lendo googleMobileAdsJson.
        androidSdk: 'classic',
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
    // Push remoto no Android (FCM): caminho do google-services.json (no EAS, uma variável do tipo arquivo)
    android: { ...config.android, ...(env.GOOGLE_SERVICES_JSON ? { googleServicesFile: env.GOOGLE_SERVICES_JSON } : {}) },
    plugins,
  };
};
