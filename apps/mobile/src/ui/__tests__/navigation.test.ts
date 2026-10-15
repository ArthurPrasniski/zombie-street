import { router } from 'expo-router';
import { goBack } from '../navigation';
jest.mock('expo-router',()=>({router:{canGoBack:jest.fn(),back:jest.fn(),replace:jest.fn()}}));
beforeEach(()=>jest.clearAllMocks());
test('Back returns cold deep links to Home',()=>{
 jest.mocked(router.canGoBack).mockReturnValue(false);goBack();
 expect(router.replace).toHaveBeenCalledWith('/');expect(router.back).not.toHaveBeenCalled();
});
test('Back preserves normal navigation history',()=>{
 jest.mocked(router.canGoBack).mockReturnValue(true);goBack();
 expect(router.back).toHaveBeenCalledTimes(1);expect(router.replace).not.toHaveBeenCalled();
});
