import { Pressable, StyleSheet } from 'react-native';
import { AppText } from '@/ui/kit/AppText';
export function PixelButton({label,onPress,selected=false,accessibilityLabel}:{label:string;onPress:()=>void;selected?:boolean;accessibilityLabel?:string}) {
 return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel??label} accessibilityState={{selected}} onPress={onPress} style={({pressed})=>[styles.button,selected&&styles.selected,pressed&&styles.pressed]}>
  <AppText variant="small" color={selected?'#171b2c':'#ffe1aa'}>{label}</AppText>
 </Pressable>;
}
const styles=StyleSheet.create({
 button:{minHeight:44,paddingHorizontal:12,justifyContent:'center',alignItems:'center',borderWidth:2,borderColor:'#527553',backgroundColor:'#242d3d',borderBottomWidth:5},
 selected:{backgroundColor:'#b8e835',borderColor:'#527553'},pressed:{opacity:.7,transform:[{translateY:2}]},
});
