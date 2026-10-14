import { View } from 'react-native';
import { tutorialText as text } from '@/i18n/tutorial';
import { useProgressStore } from '@/state/progressStore';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
import { colors } from '@/ui/theme';
export function TutorialRadio({ active }: { active: boolean }) {
 const step = useProgressStore((s) => s.tutorialStep);
 if (!active || step >= 4) return null;
 return <View style={{ position: 'absolute', left: 12, right: 12, top: 80, padding: 12, gap: 6, borderRadius: 12, backgroundColor: colors.surface }}>
  <AppText variant="small">{text.title} · {step + 1}/4</AppText>
  <AppText variant="small">{text.steps[step]}</AppText>
  <Button label={text.skip} variant="dark" size="s" onPress={() => useProgressStore.getState().setTutorial(5)} />
 </View>;
}
