import { localizedName } from '@/i18n/names';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { expeditionText } from '@/i18n/expedition';
import { EXPEDITION_UNLOCK } from '@/game/data/expedition';
import type { ExpeditionBoon } from '@/game/data/expedition';
import { GameModal } from '@/ui/modals/GameModal';
import { Button } from '@/ui/kit/Button';
import { useWeeklyStore } from '@/services/weekly';
import { WEEKLY_DECK } from '@zombie-road/shared/weekly';
import { TutorialRadio } from '@/ui/combat/TutorialRadio';
import { tutorialText } from '@/i18n/tutorial';
import { CARDS, isTroop } from '@/game/data/cards';
import { MAX_TROOPS } from '@/game/data/constants';
import { SCENARIO_EVENTS } from '@/game/data/events';
import { stageZombies } from '@/game/data/stages';
import { introFor } from '@/game/data/story';
import { survivalWorld, survivalZombies } from '@/game/data/survival';
import { worldDef, worldOf, WORLDS } from '@/game/data/worlds';
import { ZOMBIES } from '@/game/data/zombies';
import { GameCanvas } from '@/game/render/GameCanvas';
import type { UnitId } from '@/game/render/sprites';
import type { CardId, ZombieId } from '@/game/types';
import { useCardDrag } from '@/hooks/useCardDrag';
import { useCombatEvents } from '@/hooks/useCombatEvents';
import { TRAY_TOP, TRAY_BOTTOM, TRAY_GAP, useCombatLayout } from '@/hooks/useCombatLayout';
import { type DevOptions, type MatchKind, matchDeck, useGameLoop } from '@/hooks/useGameLoop';
import { t as pt } from '@/i18n';
import { useProgressStore } from '@/state/progressStore';
import { isHeard } from '@/state/radio';
import { useSessionStore } from '@/state/sessionStore';
import { CardView } from '@/ui/cards/CardView';
import { BloodBar } from '@/ui/combat/BloodBar';
import { CardHand } from '@/ui/combat/CardHand';
import { CombatHud } from '@/ui/combat/CombatHud';
import { CombatModals } from '@/ui/combat/CombatModals';
import { StageReplayGate } from '@/ui/combat/StageReplayGate';
import { EventBanner } from '@/ui/combat/EventBanner';
import { WaveBanner } from '@/ui/combat/WaveBanner';
import { AppText } from '@/ui/kit/AppText';
import { colors } from '@/ui/theme';
import { worldName, worldTint } from '@/ui/worldInfo';

type Params = { mode?: string; autoplay?: string; stress?: string; fast?: string; spawn?: string; event?: string; stage?: string; deck?: string; cast?: string;artworld?:string };

/** Ferramentas de desenvolvimento pela URL (docs/ARQUITETURA.md); fora do __DEV__, nada. */
function devOptions(dev: Params): DevOptions {
  if (!__DEV__) return {};
  return {
    autoplay: dev.autoplay === '1',
    stress: dev.stress === '1',
    fast: dev.fast === '1',
    spawn: dev.spawn ? (dev.spawn.split(',').filter((id) => id in ZOMBIES) as ZombieId[]) : undefined,
    event: SCENARIO_EVENTS.find((kind) => kind === dev.event),
    deck: dev.deck ? (dev.deck.split(',').filter((id) => id in CARDS) as CardId[]) : undefined,
    cast: dev.cast ? (dev.cast.split(',').filter((id) => id in CARDS) as CardId[]) : undefined,
  };
}

/** Combate da fase escolhida em Fases (GDD seção 12) ou da Sobrevivência (`?mode=survival`, seção 17.9). */
export default function CombatScreen() {
  const params = useLocalSearchParams<Params>();
  const savedStage = useProgressStore((s) => s.currentStage);
  const stage = params.mode === 'weekly' ? useWeeklyStore.getState().attempt?.stage ?? 1 : params.mode === 'training' ? 1 : __DEV__ && params.stage ? Math.max(1, Number(params.stage)) : savedStage;
  const [attempt, setAttempt] = useState(0);
  if (params.mode === 'expedition' && useProgressStore.getState().highestCleared < EXPEDITION_UNLOCK) return <Redirect href="/expedition" />;
  if (params.mode === 'weekly' && !useWeeklyStore.getState().attempt) return <Redirect href="/weekly" />;
  return (
    <StageReplayGate key={`${params.mode}:${stage}:${attempt}`} stage={stage} survival={params.mode === 'survival' || params.mode === 'expedition' || params.mode === 'training' || params.mode === 'weekly'}>
      <CombatMatch onReplay={() => setAttempt((n) => n + 1)} />
    </StageReplayGate>
  );
}

function CombatMatch({ onReplay }: { onReplay: () => void }) {
  const params = useLocalSearchParams<Params>();
  const weekly = params.mode === 'weekly';
  const training = params.mode === 'training' || weekly;
  const expedition = params.mode === 'expedition';
  const survival = params.mode === 'survival' || expedition;
  const [boons,setBoons] = useState<ExpeditionBoon[]>([]);
  const savedStage = useProgressStore((s) => s.currentStage);
  // Em desenvolvimento, `?stage=23` abre qualquer fase (para ver os outros mundos)
  const stage = params.mode === 'weekly' ? useWeeklyStore.getState().attempt?.stage ?? 1 : params.mode === 'training' ? 1 : __DEV__ && params.stage ? Math.max(1, Number(params.stage)) : savedStage;
  const savedDeck = useProgressStore((s) => s.deck);
  const devDeck = devOptions(params).deck;
  const deck = weekly ? [...WEEKLY_DECK] : devDeck ? matchDeck(devDeck, savedDeck) : savedDeck;
  const session = useSessionStore();
  const [runId, setRunId] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);
  const { result, clearResult, scenario, onEvent } = useCombatEvents(training, expedition, !weekly && !survival && stage === 1);
  // Rádio: abertura do mundo antes da 1ª fase (com o jogo pausado) e fechamento depois do chefe
  const [intro, setIntro] = useState(() => {
    const id = survival || training ? null : introFor(stage);
    return id && !isHeard(useProgressStore.getState(), id) ? id : null;
  });
  const [outroHeard, setOutroHeard] = useState<string | null>(null);
  const outro = result?.kind === 'cleared' && result.outro !== outroHeard ? result.outro : null;
  const radioId = intro ?? outro;

  // Na Sobrevivência o cenário muda a cada 10 ondas; as sheets seguem o mundo atual
  const worldIndex = survival ? survivalWorld(session.wave) : worldOf(stage);
  const world = survival ? WORLDS[worldIndex] : worldDef(worldIndex);
  // Development art review can use training without advancing a campaign save.
  const visualWorld=__DEV__?WORLDS.find(w=>w.id===params.artworld)?.id??world.id:world.id;
  const { insets, sceneW, sceneH, stripH, cardWidth, scaleY } = useCombatLayout();
  const zombies = [...(survival ? survivalZombies(session.wave) : stageZombies(stage)), ...(devOptions(params).spawn ?? [])];
  const units: UnitId[] = [...deck.filter((c) => isTroop(CARDS[c])), ...zombies] as UnitId[];
  const match: MatchKind = expedition ? { mode: 'expedition' } : weekly ? { mode: 'weekly' } : training ? { mode: 'training' } : survival ? { mode: 'survival' } : { mode: 'stage', stage };
  const { snapshot, send } = useGameLoop(match, runId, (event) => { if (event.type === 'expeditionChoice') setBoons(event.choices); onEvent(event); }, devOptions(params));
  const { drag, draggingSlot, canvasView, measure, ghostStyle, handlers } = useCardDrag(session.hand, send, cardWidth, scaleY);

  const togglePause = () => send({ type: 'setPaused', paused: !session.paused });
  const askExit = () => {
    send({ type: 'setPaused', paused: true });
    setConfirmExit(true);
  };
  const stay = () => {
    setConfirmExit(false);
    send({ type: 'setPaused', paused: false });
  };
  const restart = () => {
    if (!survival) { onReplay(); return; }
    clearResult();
    setBoons([]);
    setRunId((id) => id + 1);
  };
  useEffect(() => {
    if (intro) send({ type: 'setPaused', paused: true });
    // Só na montagem: a abertura segura a partida até o jogador fechar o rádio
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const closeRadio = () => {
    if (!radioId) return;
    useProgressStore.getState().hearRadio(radioId);
    if (radioId === intro) {
      setIntro(null);
      send({ type: 'setPaused', paused: false });
    } else {
      setOutroHeard(radioId);
    }
  };
  const nextStage = () => {
    if (useProgressStore.getState().selectStage(stage + 1)) clearResult();
  };

  const showBanner = session.phase === 'intermission' && !session.paused && !result;

  return (
    <View style={styles.screen}>
      <View ref={canvasView} style={[styles.scene, { width: sceneW, height: sceneH }]} onLayout={measure}>
        <GameCanvas snapshot={snapshot} drag={drag} width={sceneW} height={sceneH} world={visualWorld} units={units} />
        {!survival && worldTint(worldIndex) && <View style={[styles.tint, { backgroundColor: worldTint(worldIndex) ?? undefined }]} pointerEvents="none" />}
        <View style={[StyleSheet.absoluteFill, { top: insets.top, left: insets.left, right: insets.right }]} pointerEvents="box-none">
          <TutorialRadio active={!weekly && stage === 1 && !survival && !intro && !result && !scenario} />
          {scenario && !result && <EventBanner kind={scenario} />}
        </View>
        {training && <View style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}><AppText variant="small">{tutorialText.noReward}</AppText></View>}
        {showBanner && <WaveBanner />}
        {session.troopsFull && !result && (
          <View style={styles.full} pointerEvents="none">
            <AppText variant="small" color={colors.white}>
              {pt.combat.fieldFull(MAX_TROOPS).toUpperCase()}
            </AppText>
          </View>
        )}
      </View>
      <View style={[styles.strip, { height: stripH, paddingBottom: insets.bottom + TRAY_BOTTOM }]}>
        <CombatHud onSpeed={(speed) => send({ type: 'setSpeed', speed })} onBack={askExit} onTogglePause={togglePause} />
        <CardHand hand={session.hand} next={session.next} blood={session.blood} troopsFull={session.troopsFull} cardWidth={cardWidth} draggingSlot={draggingSlot} {...handlers} />
        <BloodBar snapshot={snapshot} blood={session.blood} width={cardWidth * 4 + 24} />
      </View>

      <Animated.View style={[styles.ghost, ghostStyle]} pointerEvents="none">
        {draggingSlot !== null && session.hand[draggingSlot] && <CardView card={session.hand[draggingSlot]} width={cardWidth} />}
      </Animated.View>

      {!!boons.length && <GameModal title={expeditionText.choose} buttons={<>{boons.map((boon) => <Button key={boon} label={expeditionText[boon]} onPress={() => { send({ type: 'chooseBoon', boon }); setBoons([]); }} />)}</>} />}
      {!boons.length && <CombatModals
        weekly={weekly}
        training={training}
        result={result}
        radio={radioId ? { id: radioId, place: pt.radio.world(worldIndex + 1, survival ? localizedName(world.name) : worldName(worldIndex)) } : null}
        onRadioClose={closeRadio}
        paused={session.paused}
        confirmExit={confirmExit}
        onResume={togglePause}
        onStay={stay}
        onRetry={restart}
        onNext={nextStage}
      />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, alignItems: 'center' },
  scene: { overflow: 'hidden' },
  strip: { alignSelf: 'stretch', paddingHorizontal: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line, alignItems: 'center', justifyContent: 'flex-start', paddingTop: TRAY_TOP, gap: TRAY_GAP },
  ghost: { position: 'absolute', left: 0, top: 0 },
  tint: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  full: { position: 'absolute', bottom: 8, alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 2, backgroundColor: 'rgba(216, 38, 58, 0.85)', borderWidth: 2, borderColor: colors.outline },
});
