import { localizedName } from '@/i18n/names';
import { comfortText } from '@/i18n/comfort';
import { masteryTier, MASTERY_GOALS } from '@/game/data/cosmetics';
import { CARDS } from '@/game/data/cards';
import type { CardId } from '@/game/types';
import { useProgressStore } from '@/state/progressStore';
import { cardDescription, cardStats, evolutionText } from './stats';
import { decksText } from '@/i18n/decks';
import { GameModal } from '@/ui/modals/GameModal';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
export function CardDetail({ card, onClose }: { card: CardId; onClose: () => void }) {
 const uses = useProgressStore((s) => s.mastery[card] ?? 0); const tier = masteryTier(uses);
 const level = useProgressStore((s) => s.cardLevels[card]); const def = CARDS[card];
 return <GameModal title={`${localizedName(def.name)} · ${level}`} buttons={<Button label={decksText.cancel} onPress={onClose} />}>
  <AppText>{comfortText.mastery}: {comfortText.titles[tier]} · {uses}/{MASTERY_GOALS[tier] ?? MASTERY_GOALS[2]}</AppText>
  <AppText>{cardDescription(card, level)}</AppText>
  {cardStats(card, level).map((s) => <AppText key={s.label}>{s.label}: {s.value}{s.suffix}</AppText>)}
  {evolutionText(card, level) && <AppText>{evolutionText(card, level)}</AppText>}
 </GameModal>;
}
