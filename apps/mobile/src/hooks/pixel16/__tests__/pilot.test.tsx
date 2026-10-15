import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { usePixelPilot, type PilotRenderer } from '../usePixelPilot';
import { createPilotWorld } from '../pilot';

// Any attempt by the pilot to load persistent progression or economy fails this suite.
jest.mock('@/state/progressStore',()=>{throw new Error('Pilot must not access saved progress');});
jest.mock('@/services/economy',()=>{throw new Error('Pilot must not access the economy');});
jest.mock('expo-router',()=>({useFocusEffect:(callback:()=>void)=>jest.requireActual<typeof import('react')>('react').useEffect(callback,[callback])}));
jest.mock('react-native-reanimated',()=>({useSharedValue:(initial:unknown)=>{
 const [shared]=jest.requireActual<typeof import('react')>('react').useState(()=>{let value=initial;return {get:()=>value,set:(next:unknown)=>{value=next;}};});return shared;
}}));
let hook:ReturnType<typeof usePixelPilot>;
function Harness({renderer='pixel',run=0}:{renderer?:PilotRenderer;run?:number}) {
 const value=usePixelPilot(run,renderer,true,true);
 useEffect(()=>{hook=value;});return null;
}
let tree:ReactTestRenderer;let now=0;let next=1;
const frames=new Map<number,FrameRequestCallback>();
let background:(state:AppStateStatus)=>void;
const remove=jest.fn();
function advance(count:number) {for(let i=0;i<count;i++){now+=1000/60;const callbacks=[...frames.values()];frames.clear();act(()=>{callbacks.forEach(callback=>callback(now));});}}
beforeEach(()=>{
 now=0;frames.clear();remove.mockClear();
 jest.spyOn(globalThis,'requestAnimationFrame').mockImplementation(callback=>{const id=next++;frames.set(id,callback);return id;});
 jest.spyOn(globalThis,'cancelAnimationFrame').mockImplementation(id=>{if(id!=null)frames.delete(id);});
 jest.spyOn(AppState,'addEventListener').mockImplementation((_type,listener)=>{background=listener;return {remove};});
 act(()=>{tree=create(<Harness/>);});
});
afterEach(()=>{act(()=>tree.unmount());jest.restoreAllMocks();});
test('uma fase completa permanece isolada da economia e tem resultado reproduzível',()=>{
 advance(36000);const first=hook.snapshot.get();
 expect(['cleared','failed']).toContain(hook.hud.phase);
 expect(first.time).toBeGreaterThan(10);
 act(()=>tree.update(<Harness run={1}/>));advance(36000);
 expect(hook.snapshot.get()).toEqual(first);
});
test('alternar o visual preserva tempo, unidades e cartas da mesma partida',()=>{
 advance(600);const before=hook.snapshot.get();const hand=hook.hud.hand;
 act(()=>tree.update(<Harness renderer="current"/>));
 expect(hook.snapshot.get()).toBe(before);expect(hook.hud.hand).toEqual(hand);
 advance(90);expect(hook.snapshot.get().time).toBeGreaterThan(before.time);
 expect(hook.metrics.current.fps).toBeGreaterThan(0);
});
test('background pausa a simulação e desmontar cancela o loop',()=>{
 advance(60);act(()=>background('background'));advance(30);
 const paused=hook.snapshot.get().time;advance(60);
 expect(hook.snapshot.get().time).toBe(paused);expect(hook.hud.paused).toBe(true);
 act(()=>tree.unmount());expect(frames.size).toBe(0);expect(remove).toHaveBeenCalled();
});
test('cada treino nasce com o mesmo deck e sem compartilhar arrays mutáveis',()=>{
 const first=createPilotWorld(),second=createPilotWorld();
 expect(first.hand).toEqual(second.hand);first.hand.pop();
 expect(first.hand).not.toEqual(second.hand);expect(second.pendingCash).toBe(0);
});
