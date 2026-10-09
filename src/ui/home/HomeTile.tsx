import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { AppText } from '@/ui/kit/AppText';
import { Badge } from '@/ui/kit/Badge';
import { Card } from '@/ui/kit/Card';
import { radius } from '@/ui/theme';

interface Props {
  icon: ImageSourcePropType;
  title: string;
  subtitle: string;
  color: string;
  subtitleColor: string;
  badge?: number;
  onPress: () => void;
}

/** Atalho pequeno da Home: ícone, título e uma linha (Oficina, Conquistas, Bestiário). */
export function HomeTile({ icon, title, subtitle, color, subtitleColor, badge = 0, onPress }: Props) {
  return (
    <View style={styles.wrap}>
      <Card color={color} containerStyle={styles.fill} style={styles.tile} padding={12} onPress={onPress}>
        <View style={styles.inner}>
          <Image source={icon} style={styles.icon} />
          <AppText variant="heading" numberOfLines={1} adjustsFontSizeToFit style={styles.title}>
            {title.toUpperCase()}
          </AppText>
          <AppText variant="small" color={subtitleColor} numberOfLines={2} style={styles.subtitle}>
            {subtitle.toUpperCase()}
          </AppText>
        </View>
      </Card>
      <Badge count={badge} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  fill: { flex: 1 },
  tile: { minHeight: 120, borderRadius: radius.l },
  inner: { alignItems: 'center' },
  icon: { width: 44, height: 44, marginBottom: 4 },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', fontSize: 11, lineHeight: 14 },
});
