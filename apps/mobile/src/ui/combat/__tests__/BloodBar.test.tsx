import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import type { RenderSnapshot } from '@/game/types';
import { EMPTY_SNAPSHOT } from '@/game/engine/snapshot';
import { BloodBar } from '../BloodBar';

jest.mock('react-native-reanimated',()=>({__esModule:true,default:{View:jest.requireActual('react-native').View},useAnimatedStyle:(read:()=>unknown)=>read()}));
let tree:ReactTestRenderer;
afterEach(()=>act(()=>tree.unmount()));
test.each([0,3.5,5,10,12])('blood %s renders a bounded pixel fill and stays full at capacity',value=>{
 const snapshot={get:()=>({...EMPTY_SNAPSHOT,blood:value})} as unknown as SharedValue<RenderSnapshot>;
 act(()=>{tree=create(<BloodBar snapshot={snapshot} blood={Math.floor(value)} width={300}/>);});
 const track=StyleSheet.flatten(tree.root.findAll(node=>node.props.testID==='blood-track')[0].props.style);
 const fill=StyleSheet.flatten(tree.root.findAll(node=>node.props.testID==='blood-fill')[0].props.style);
 expect(typeof fill.width).toBe('number');
 expect(fill.width).toBeCloseTo((track.width-track.borderWidth*2)*Math.min(10,value)/10);
 expect(tree.root.findAll(node=>node.props.accessibilityRole==='progressbar')[0].props.accessibilityValue.now).toBe(Math.min(10,Math.floor(value)));
});
