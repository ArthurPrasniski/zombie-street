const { withAppBuildGradle } = require('expo/config-plugins');

// O template do SDK 57 usa proguard-android.txt, que contém -dontoptimize.
// Preserva as regras dos SDKs e troca apenas o arquivo padrão pela versão otimizada.
module.exports = function withAndroidOptimization(config) {
  return withAppBuildGradle(config, (config) => {
    const original = config.modResults.contents;
    const optimized = original.replace(/getDefaultProguardFile\((['"])proguard-android\.txt\1\)/g, 'getDefaultProguardFile("proguard-android-optimize.txt")');
    if (!optimized.includes('getDefaultProguardFile("proguard-android-optimize.txt")') && !optimized.includes("getDefaultProguardFile('proguard-android-optimize.txt')")) {
      throw new Error('Não foi possível configurar o arquivo ProGuard otimizado; revise o template Android antes de gerar o release.');
    }
    config.modResults.contents = optimized;
    return config;
  });
};
