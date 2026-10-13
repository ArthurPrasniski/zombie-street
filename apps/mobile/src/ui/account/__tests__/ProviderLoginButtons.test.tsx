import { AppleAuthenticationButton } from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { ProviderLoginButtons } from '../ProviderLoginButtons';

jest.mock('expo-apple-authentication', () => ({
  AppleAuthenticationButton: (props: object) => jest.requireActual<typeof import('react')>('react').createElement('AppleButton', props),
  AppleAuthenticationButtonType: { SIGN_IN: 0 },
  AppleAuthenticationButtonStyle: { WHITE: 0 },
}));

let tree: ReactTestRenderer;
const onGoogle = jest.fn();
const onApple = jest.fn();

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  onGoogle.mockClear();
  onApple.mockClear();
});
afterEach(() => {
  if (tree) act(() => tree.unmount());
  jest.restoreAllMocks();
});

function render(props: Partial<React.ComponentProps<typeof ProviderLoginButtons>> = {}) {
  act(() => {
    tree = create(<ProviderLoginButtons providers={[]} appleAvailable busy={false} onGoogle={onGoogle} onApple={onApple} {...props} />);
  });
  return tree.root;
}

test('convidado no iOS pode entrar com Google ou Apple', () => {
  const root = render();
  act(() => root.findByProps({ testID: 'google-login' }).props.onPress());
  act(() => root.findByType(AppleAuthenticationButton).props.onPress());
  expect(onGoogle).toHaveBeenCalledTimes(1);
  expect(onApple).toHaveBeenCalledTimes(1);
});

test('Android mostra apenas Google mesmo se Apple for indicada como disponível', () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  const root = render();
  expect(root.findAllByProps({ testID: 'google-login' }, { deep: false })).toHaveLength(1);
  expect(root.findAllByType(AppleAuthenticationButton)).toHaveLength(0);
});

test('iOS sem suporte a Apple mostra apenas Google', () => {
  expect(render({ appleAvailable: false }).findAllByType(AppleAuthenticationButton)).toHaveLength(0);
});

test.each(['google', 'apple'] as const)('conta vinculada com %s oculta todos os botões de login', (provider) => {
  render({ providers: [provider] });
  expect(tree.toJSON()).toBeNull();
});

test('entrar remove os botões e sair volta a mostrá-los', () => {
  render();
  act(() => tree.update(<ProviderLoginButtons providers={['google']} appleAvailable busy={false} onGoogle={onGoogle} onApple={onApple} />));
  expect(tree.toJSON()).toBeNull();
  act(() => tree.update(<ProviderLoginButtons providers={[]} appleAvailable busy={false} onGoogle={onGoogle} onApple={onApple} />));
  expect(tree.root.findAllByProps({ testID: 'google-login' }, { deep: false })).toHaveLength(1);
  expect(tree.root.findAllByType(AppleAuthenticationButton)).toHaveLength(1);
});

test('bloqueia novas tentativas enquanto uma operação está em andamento', () => {
  const root = render({ busy: true });
  const google = root.findByProps({ testID: 'google-login' });
  expect(google.props.disabled).toBe(true);
  act(() => google.props.onPress());
  act(() => root.findByType(AppleAuthenticationButton).props.onPress());
  expect(onGoogle).not.toHaveBeenCalled();
  expect(onApple).not.toHaveBeenCalled();
});
