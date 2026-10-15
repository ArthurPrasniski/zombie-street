import { router } from 'expo-router';

/** Cold deep links have no prior screen; their Back action returns to Home. */
export function goBack() {
 if(router.canGoBack())router.back();
 else router.replace('/');
}
