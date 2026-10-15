import {PaintStyle,Skia,type SkCanvas,type SkPaint} from '@shopify/react-native-skia';
export const OUTLINE='#171b22';
const LINE=3;
const EDGE=[[-.4,-1],[.4,-1],[.4,-.85],[.7,-.85],[.7,-.65],[.9,-.65],[.9,-.35],[1,-.35],[1,.35],[.9,.35],[.9,.65],[.7,.65],[.7,.85],[.4,.85],[.4,1],[-.4,1],[-.4,.85],[-.7,.85],[-.7,.65],[-.9,.65],[-.9,.35],[-1,.35],[-1,-.35],[-.9,-.35],[-.9,-.65],[-.7,-.65],[-.7,-.85],[-.4,-.85]];
export function noise(i:number,j:number,t:number):number{
 'worklet';const n=Math.sin(i*12.9898+j*78.233+t*37.719)*43758.5453;return n-Math.floor(n);
}
/** Stepped contours retain the original effect bounds and center. */
export function pixelEllipsePath(x:number,y:number,width:number,height:number){
 'worklet';const path=Skia.PathBuilder.Make(),rx=width/2,ry=height/2;
 for(let i=0;i<EDGE.length;i++){const xx=x+rx+Math.round(EDGE[i][0]*rx),yy=y+ry+Math.round(EDGE[i][1]*ry);if(i===0)path.moveTo(xx,yy);else path.lineTo(xx,yy);}
 path.close();return path.detach();
}
export function pixelOval(canvas:SkCanvas,paint:SkPaint,x:number,y:number,width:number,height:number){
 'worklet';paint.setAntiAlias(false);canvas.drawPath(pixelEllipsePath(x,y,width,height),paint);
}
export function pixelCircle(canvas:SkCanvas,paint:SkPaint,x:number,y:number,r:number){
 'worklet';pixelOval(canvas,paint,x-r,y-r,r*2,r*2);
}
export function blob(canvas:SkCanvas,paint:SkPaint,x:number,y:number,r:number,color:string,alpha:number,outline=true){
 'worklet';const path=pixelEllipsePath(x-r,y-r,r*2,r*2);paint.setAntiAlias(false);paint.setAlphaf(alpha);
 if(outline){paint.setStyle(PaintStyle.Stroke);paint.setStrokeWidth(LINE*2);paint.setColor(Skia.Color(OUTLINE));canvas.drawPath(path,paint);}
 paint.setStyle(PaintStyle.Fill);paint.setColor(Skia.Color(color));canvas.drawPath(path,paint);
}
export function flame(canvas:SkCanvas,paint:SkPaint,x:number,y:number,h:number,color:string,alpha:number){
 'worklet';const w=h*.45,path=Skia.PathBuilder.Make();
 const points=[[0,-1],[.25,-.7],[.25,-.55],[.7,-.55],[.7,-.3],[1,-.3],[1,-.12],[.5,-.12],[.5,0],[-.5,0],[-.5,-.12],[-1,-.12],[-1,-.3],[-.7,-.3],[-.7,-.55],[-.25,-.55],[-.25,-.7]];
 for(let i=0;i<points.length;i++){const xx=x+Math.round(points[i][0]*w),yy=y+Math.round(points[i][1]*h);if(i===0)path.moveTo(xx,yy);else path.lineTo(xx,yy);}
 path.close();const shape=path.detach();paint.setAntiAlias(false);paint.setStyle(PaintStyle.Stroke);paint.setStrokeWidth(LINE);paint.setColor(Skia.Color(OUTLINE));paint.setAlphaf(alpha);canvas.drawPath(shape,paint);
 paint.setStyle(PaintStyle.Fill);paint.setColor(Skia.Color(color));canvas.drawPath(shape,paint);
}
export function plus(canvas:SkCanvas,paint:SkPaint,x:number,y:number,size:number,alpha:number){
 'worklet';paint.setAntiAlias(false);paint.setStyle(PaintStyle.Fill);paint.setAlphaf(alpha);paint.setColor(Skia.Color(OUTLINE));
 canvas.drawRect(Skia.XYWHRect(x-size-2,y-size*.4-2,size*2+4,size*.8+4),paint);canvas.drawRect(Skia.XYWHRect(x-size*.4-2,y-size-2,size*.8+4,size*2+4),paint);
 paint.setColor(Skia.Color('#c3d875'));canvas.drawRect(Skia.XYWHRect(x-size,y-size*.4,size*2,size*.8),paint);canvas.drawRect(Skia.XYWHRect(x-size*.4,y-size,size*.8,size*2),paint);
}
