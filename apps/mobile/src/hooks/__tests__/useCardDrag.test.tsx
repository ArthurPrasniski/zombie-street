import {useEffect} from 'react';
import {act,create,type ReactTestRenderer} from 'react-test-renderer';
import type {View} from 'react-native';
import {useCardDrag} from '../useCardDrag';
jest.mock('react-native-reanimated',()=>({
 useSharedValue:(initial:unknown)=>{
  const [shared]=jest.requireActual<typeof import('react')>('react').useState(()=>{let value=initial;return {get:()=>value,set:(next:unknown)=>{value=next;}};});return shared;
 },
 useAnimatedStyle:(fn:()=>unknown)=>fn(),
}));
const send=jest.fn();let hook:ReturnType<typeof useCardDrag>;let tree:ReactTestRenderer;
function Harness({scaleY}:{scaleY?:number}){const value=useCardDrag(['sniper'],send,70,scaleY);useEffect(()=>{hook=value;});return null;}
beforeEach(()=>{
 send.mockClear();act(()=>{tree=create(<Harness/>);});
 hook.canvasView.current={measureInWindow:(callback:(x:number,y:number,w:number,h:number)=>void)=>callback(0,0,300,575)} as unknown as View;
});
afterEach(()=>act(()=>tree.unmount()));
test('soltar uma carta na casa abaixo da arena não envia comando de jogo',()=>{
 act(()=>hook.handlers.onDragStart(0,150,500));
 act(()=>hook.handlers.onDragMove(0,150,500));expect(hook.drag.get().active).toBe(false);
 act(()=>hook.handlers.onDragEnd(0,150,500));expect(send).not.toHaveBeenCalled();
});
test('a decoração extra preserva as coordenadas de uma jogada válida no campo',()=>{
 act(()=>hook.handlers.onDragStart(0,150,350));act(()=>hook.handlers.onDragEnd(0,150,350));
 expect(send).toHaveBeenCalledWith({type:'playCard',slot:0,x:300,y:725});
});


test('a compact full-width scene maps vertical touches with its rendering scale',()=>{
 act(()=>tree.update(<Harness scaleY={.4}/>));
 hook.canvasView.current={measureInWindow:(callback:(x:number,y:number,w:number,h:number)=>void)=>callback(0,0,300,360)} as unknown as View;
 act(()=>hook.handlers.onDragStart(0,150,280));
 act(()=>hook.handlers.onDragEnd(0,150,280));
 expect(send).toHaveBeenCalledWith({type:'playCard',slot:0,x:300,y:725});
});
