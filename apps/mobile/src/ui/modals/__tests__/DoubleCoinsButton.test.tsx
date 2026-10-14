import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { DoubleCoinsButton } from '../DoubleCoinsButton';
import { Button } from '@/ui/kit/Button';

let mockMember = false;
jest.mock('@/hooks/useMembershipActive', () => ({ useMembershipActive: () => mockMember }));
jest.mock('@/services/ads', () => ({ useAdStore: () => true }));
jest.mock('@/services/rewards', () => ({ canDouble: () => true, doublesLeft: () => 10, doubleCoins: jest.fn() }));
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: jest.requireActual<typeof import('react-native')>('react-native').View },
  ZoomIn: { springify: () => ({ damping: () => undefined }) },
}));

test('assinantes não veem o botão de anúncio para dobrar moedas', () => {
  let tree!: ReactTestRenderer;
  mockMember = true;
  act(() => { tree = create(<DoubleCoinsButton coins={50} />); });
  expect(tree.toJSON()).toBeNull();
  act(() => tree.unmount());
});

test('não assinantes continuam vendo o bônus opcional', () => {
  let tree!: ReactTestRenderer;
  mockMember = false;
  act(() => { tree = create(<DoubleCoinsButton coins={50} />); });
  expect(tree.root.findAllByType(Button)).toHaveLength(1);
  act(() => tree.unmount());
});
