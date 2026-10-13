import * as AppleAuthentication from 'expo-apple-authentication';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Provider } from '@zombie-road/shared/api';

import { t } from '@/i18n';

interface Props {
  providers: readonly Provider[];
  appleAvailable: boolean;
  busy: boolean;
  onGoogle: () => void;
  onApple: () => void;
}

/** Google segue os assets e cores oficiais; Apple usa seu componente nativo. */
export function ProviderLoginButtons({ providers, appleAvailable, busy, onGoogle, onApple }: Props) {
  if (providers.length > 0) return null;
  return (
    <View style={styles.buttons}>
      <Pressable
        testID="google-login"
        accessibilityRole="button"
        accessibilityLabel={t.account.google}
        accessibilityState={{ disabled: busy }}
        disabled={busy}
        onPress={() => { if (!busy) onGoogle(); }}
        style={({ pressed }) => [styles.button, styles.google, pressed && styles.googlePressed]}>
        <Image source={require('@/assets/images/google-g.png')} style={styles.googleLogo} accessible={false} />
        <Text style={styles.googleText} numberOfLines={1}>{t.account.google}</Text>
      </Pressable>
      {Platform.OS === 'ios' && appleAvailable && (
        <View style={styles.button} pointerEvents={busy ? 'none' : 'auto'} accessibilityState={{ disabled: busy }}>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={4}
            style={styles.button}
            onPress={() => { if (!busy) onApple(); }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  buttons: { gap: 12, width: '100%', maxWidth: 360, alignSelf: 'center', marginTop: 6 },
  button: { width: '100%', height: 48 },
  google: { backgroundColor: '#FFFFFF', borderColor: '#747775', borderWidth: 1, borderRadius: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: Platform.OS === 'ios' ? 16 : 12, gap: Platform.OS === 'ios' ? 12 : 10 },
  googlePressed: { backgroundColor: '#F2F2F2' },
  googleLogo: { width: 20, height: 20, resizeMode: 'contain' },
  googleText: { fontFamily: 'GoogleSans', fontWeight: '500', fontSize: 14, lineHeight: 20, color: '#1F1F1F', flexShrink: 1 },
});
