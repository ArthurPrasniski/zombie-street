import { Canvas, Image, useImage, FilterMode, MipmapMode } from '@shopify/react-native-skia';
import { StyleSheet, View } from 'react-native';
import { PIXEL_CARD_ART } from '@/game/render/pixel16/assets';
import { CARDS } from '@/game/data/cards';
import type { CardId } from '@/game/types';
import { AppText } from '@/ui/kit/AppText';
export function PixelCard({card,width,dimmed=false,hideName=false}:{card:CardId;width:number;dimmed?:boolean;hideName?:boolean}) {
 const image=useImage(PIXEL_CARD_ART[card]??null);const size=width-4;
 return <View accessible accessibilityLabel={`${CARDS[card].name}, ${CARDS[card].cost}`} style={[styles.card,{width,opacity:dimmed?.4:1}]}>
  <Canvas style={{width:size,height:size}}><Image image={image} x={0} y={0} width={size} height={size} fit="contain" sampling={{filter:FilterMode.Nearest,mipmap:MipmapMode.None}}/></Canvas>
  <View style={styles.cost}><AppText variant="small">{CARDS[card].cost}</AppText></View>
  {!hideName&&<AppText variant="small" numberOfLines={1} adjustsFontSizeToFit style={styles.name}>{CARDS[card].name}</AppText>}
 </View>;
}
const styles=StyleSheet.create({card:{borderWidth:2,borderColor:'#d4a454',backgroundColor:'#242d3d'},cost:{position:'absolute',left:0,top:0,paddingHorizontal:3,backgroundColor:'#b74d59'},name:{fontSize:10,lineHeight:14,textAlign:'center',paddingVertical:2}});
