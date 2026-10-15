import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { t } from '@/i18n';
import { INITIAL_SESSION, useSessionStore } from '@/state/sessionStore';
import { CombatHud } from '../CombatHud';

let mockSpeed = 1;
const mockSetSpeed = jest.fn();
jest.mock('@/state/settingsStore', () => ({ useSettingsStore: Object.assign((select: (s: {speed: number; largeText: boolean}) => unknown) => select({speed: mockSpeed, largeText: false}), {getState: () => ({setSpeed: mockSetSpeed})}) }));
let tree: ReactTestRenderer;
const onBack = jest.fn(), onPause = jest.fn(), onSpeed = jest.fn();
beforeEach(()=>{jest.clearAllMocks();mockSpeed=1;useSessionStore.setState(INITIAL_SESSION);act(()=>{tree=create(<CombatHud onBack={onBack} onTogglePause={onPause} onSpeed={onSpeed}/>);});});
afterEach(()=>act(()=>tree.unmount()));
const control=(label: string)=>tree.root.findAll(node=>node.props.accessibilityRole==='button' && node.props.accessibilityLabel===label && typeof node.props.onPress==='function')[0];

test('tray controls preserve back, pause and both speed actions',()=>{
 act(()=>control(t.common.back).props.onPress());expect(onBack).toHaveBeenCalledTimes(1);
 act(()=>control(t.combat.pause).props.onPress());expect(onPause).toHaveBeenCalledTimes(1);
 act(()=>control(t.combat.speed).props.onPress());expect(mockSetSpeed).toHaveBeenLastCalledWith(2);expect(onSpeed).toHaveBeenLastCalledWith(2);
 mockSpeed=2;act(()=>tree.update(<CombatHud onBack={onBack} onTogglePause={onPause} onSpeed={onSpeed}/>));
 act(()=>control(t.combat.speed).props.onPress());expect(mockSetSpeed).toHaveBeenLastCalledWith(1);expect(onSpeed).toHaveBeenLastCalledWith(1);
 act(()=>useSessionStore.setState({paused:true}));expect(control(t.combat.resume)).toBeDefined();
});

test('campaign and survival retain their accessible wave progress',()=>{
 act(()=>useSessionStore.setState({stage:12,wave:2,totalWaves:5,killed:5,total:10}));
 let status=tree.root.findAll(node=>node.props.accessibilityRole==='progressbar')[0];
 expect(status.props.accessibilityLabel).toBe(t.combat.stageWave('2-2',2,5));expect(status.props.accessibilityValue.now).toBe(30);
 act(()=>useSessionStore.setState({mode:'survival',wave:7,killed:0,total:10}));
 status=tree.root.findAll(node=>node.props.accessibilityRole==='progressbar')[0];expect(status.props.accessibilityLabel).toBe(t.survival.hud(7));expect(status.props.accessibilityValue.now).toBe(20);
});
