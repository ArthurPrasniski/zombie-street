import { Image, StyleSheet, View } from 'react-native';

import { ICONS } from '@/ui/icons';
import { AppText } from '@/ui/kit/AppText';
import { colors } from '@/ui/theme';

const DASHES = 14;

/**
 * As fases de um mundo como paradas numa estrada: vencidas com check, a próxima com um pino
 * amarelo, as outras apagadas. `first` é a fase global da primeira parada; os números são locais.
 */
export function RouteProgress({ first, total, cleared, next }: { first: number; total: number; cleared: number; next: number }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.road}>
        {Array.from({ length: DASHES }, (_, i) => (
          <View key={i} style={styles.dash} />
        ))}
      </View>
      <View style={styles.stops}>
        {Array.from({ length: total }, (_, i) => {
          const stage = first + i;
          if (stage === next && stage > cleared) {
            return (
              <View key={stage} style={styles.pin}>
                <AppText variant="number" style={styles.pinText}>
                  {`${i + 1}`}
                </AppText>
              </View>
            );
          }
          const done = stage <= cleared;
          return (
            <View key={stage} style={[styles.stop, done && styles.done]}>
              {done ? (
                <Image source={ICONS.check} style={styles.check} />
              ) : (
                <AppText variant="small" color={colors.textMuted} style={styles.stopText}>
                  {`${i + 1}`}
                </AppText>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 40, justifyContent: 'center' },
  road: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#3a3640',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    borderWidth: 2,
    borderColor: colors.outline,
  },
  dash: { width: 10, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255, 201, 40, 0.55)' },
  stops: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  stop: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHigh,
    borderWidth: 2,
    borderColor: colors.outline,
  },
  done: { backgroundColor: colors.teal },
  stopText: { fontSize: 11, lineHeight: 13 },
  check: { width: 16, height: 16 },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.yellow,
    borderWidth: 3,
    borderColor: colors.outline,
  },
  pinText: { fontSize: 17, lineHeight: 20 },
});
