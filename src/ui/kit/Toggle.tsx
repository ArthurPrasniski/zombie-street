import { Pressable, StyleSheet, View } from 'react-native';

import { Chunky } from '@/ui/kit/Chunky';
import { colors } from '@/ui/theme';

const W = 58;
const KNOB = 22;

/** Chave liga/desliga gordinha: verde-limão com a bolinha à direita quando ligada. */
export function Toggle({ value, onChange, label }: { value: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <Pressable onPress={() => onChange(!value)} accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={label} hitSlop={8}>
      {({ pressed }) => (
        <Chunky face={value ? colors.accent : '#3d3848'} edge={value ? '#6e8a20' : '#24202c'} radius={999} depth={3} pressed={pressed} gloss={0.2}>
          <View style={[styles.track, value && styles.on]}>
            <View style={styles.knob} />
          </View>
        </Chunky>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: W, height: KNOB + 8, paddingHorizontal: 4, justifyContent: 'center', alignItems: 'flex-start' },
  on: { alignItems: 'flex-end' },
  knob: { width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: colors.white, borderWidth: 2.5, borderColor: colors.outline },
});
