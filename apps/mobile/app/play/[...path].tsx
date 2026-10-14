import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useProgressStore } from '@/state/progressStore';
export default function PlayLink() {
 const { path } = useLocalSearchParams<{ path?: string[] }>();
 const parts = Array.isArray(path) ? path : []; const kind = parts[0]; const stage = Number(parts[1]);
 useEffect(() => {
  if (kind === 'deck') { router.replace('/deck'); return; }
  const selected = kind === 'stage' && Number.isInteger(stage) && useProgressStore.getState().selectStage(stage);
  router.replace(selected ? '/prepare' : '/stages');
 }, [kind, stage]);
 return null;
}
