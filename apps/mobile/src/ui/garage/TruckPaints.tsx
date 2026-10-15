import { View } from 'react-native';
import { TRUCK_PAINTS } from '@/game/data/cosmetics';
import { useProgressStore } from '@/state/progressStore';
import { comfortText } from '@/i18n/comfort';
import { AppText } from '@/ui/kit/AppText';
import { Button } from '@/ui/kit/Button';
export function TruckPaints() {
 const p = useProgressStore();
 return <View style={{ gap: 10 }}><AppText variant="label">{comfortText.paint}</AppText><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
 {Object.entries(TRUCK_PAINTS).map(([id,color],index) => <Button key={id} label={`${id === p.truckPaint ? '✓ ' : ''}${comfortText.paints[index]}`} variant="solid" color={color} size="s" disabled={!p.canPaint(id as keyof typeof TRUCK_PAINTS)} onPress={() => p.paintTruck(id as keyof typeof TRUCK_PAINTS)} />)}
 </View></View>;
}
