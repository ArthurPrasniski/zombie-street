import { goBack } from '@/ui/navigation';
import { useWeeklyStore, submitWeekly } from '@/services/weekly';
import { weeklyText as text } from '@/i18n/weekly';
import { t } from '@/i18n';
import { GameModal } from '@/ui/modals/GameModal';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
export function WeeklyResult() {
 const state = useWeeklyStore();
 return <GameModal title={text.title} buttons={<Button label={t.common.back} onPress={() => goBack()} />}>
  <AppText>{state.status === 'done' ? `${text.done} · ${text.medal}: ${state.result?.medal}/3` : state.status === 'error' ? text.error : text.checking}</AppText>
  {state.status === 'error' && <Button label={text.retry} onPress={() => { void submitWeekly(); }} />}
 </GameModal>;
}
