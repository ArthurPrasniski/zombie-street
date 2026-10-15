import {Skia,type SkCanvas,type SkPaint} from '@shopify/react-native-skia';
/** Cosmetic marks stay on the detailed pickup instead of spanning the old cartoon truck. */
export function drawDetailedTruckAppearance(canvas:SkCanvas,paint:SkPaint,look:{color:string;hull:number;gun:number;tank:number}){
 'worklet';
 paint.setAlphaf(1);paint.setColor(Skia.Color(look.color));
 canvas.drawRect(Skia.XYWHRect(283,839,34,3),paint);
 paint.setColor(Skia.Color('#b8c1c6'));
 for(let i=0;i<Math.ceil(look.hull/5);i++){
  canvas.drawRect(Skia.XYWHRect(273,848+i*5,3,4),paint);
  canvas.drawRect(Skia.XYWHRect(324,848+i*5,3,4),paint);
 }
 if(look.gun>0)canvas.drawRect(Skia.XYWHRect(298,806-Math.ceil(look.gun/5)*3,4,18),paint);
 if(look.tank>0){paint.setColor(Skia.Color('#9f4651'));canvas.drawRect(Skia.XYWHRect(318,851,3+Math.min(look.tank,10)*.3,10),paint);}
}
