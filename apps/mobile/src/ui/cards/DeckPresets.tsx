import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useProgressStore } from '@/state/progressStore';
import { deckSummary } from '@/state/decks';
import { decksText as text } from '@/i18n/decks';
import { Button } from '@/ui/kit/Button';
import { AppText } from '@/ui/kit/AppText';
import { colors } from '@/ui/theme';
export function DeckPresets() {
  const p = useProgressStore(); const summary = deckSummary(p.deck); const [manage,setManage] = useState(false);
  return <View style={{ gap: 10 }}>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{p.savedDecks.map((d, i) => <Pressable key={i} accessibilityRole="button" accessibilityState={{ selected: i === p.selectedDeck }} onPress={() => p.selectDeck(i)} style={{ paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, backgroundColor: i === p.selectedDeck ? colors.teal : colors.surface }}><AppText variant="small">{d.name}</AppText></Pressable>)}</View>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: manage }} onPress={() => setManage(!manage)}><AppText variant="small" color={colors.textMuted}>{text.average}: {summary.average.toFixed(1)} · {text.rename} {manage ? '−' : '+'}</AppText></Pressable>
    {manage && <>
      <TextInput key={p.selectedDeck} defaultValue={p.savedDecks[p.selectedDeck].name} accessibilityLabel={text.rename} maxLength={24} onEndEditing={(e) => p.renameDeck(e.nativeEvent.text)} style={{ color: colors.text, backgroundColor: colors.surface, padding: 12, borderRadius: 10 }} />
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>{p.savedDecks.map((d, i) => i !== p.selectedDeck && <Button key={i} label={`${text.copy} ${i + 1}`} variant="dark" size="s" onPress={() => p.duplicateDeck(i)} />)}</View>
      <AppText variant="small">{text.defense}: {summary.defense} · {text.area}: {summary.area} · {text.healing}: {summary.healing} · {text.control}: {summary.control}</AppText>
      {(!summary.defense || !summary.area) && <AppText variant="small" color={colors.textMuted}>{text.tip}</AppText>}
    </>}
  </View>;
}
