import {FilterMode,MipmapMode,Skia,type SkCanvas,type SkImage,type SkPaint} from '@shopify/react-native-skia';
import {detailedFrame,type DetailedSheet,type DetailedBase} from './detailedLayout';

/** Continuous world positions with nearest sampling; registration belongs to the atlas. */
export function drawDetailedFrame(canvas:SkCanvas,image:SkImage,index:number,row:number,x:number,y:number,scale:number,paint:SkPaint,flip:boolean,sheet:DetailedSheet){
 'worklet';
 const pose=detailedFrame(sheet,index,row),[sx,sy,sw,sh]=pose.source,factor=sheet.scale*scale,vertical=sheet.renderScaleY??1;
 if(flip){canvas.save();canvas.translate(x,0);canvas.scale(-1,1);canvas.translate(-x,0);}
 canvas.drawImageRectOptions(image,Skia.XYWHRect(sx,sy,sw,sh),Skia.XYWHRect(x-pose.foot[0]*factor,y-pose.foot[1]*factor*vertical,sw*factor,sh*factor*vertical),FilterMode.Nearest,MipmapMode.None,paint);
 if(flip)canvas.restore();
}

export function drawDetailedBase(canvas:SkCanvas,image:SkImage,index:number,paint:SkPaint,layout:DetailedBase){
 'worklet';
 const frame=layout.frames[index],[tx,ty,tw,th]=frame.wall.source,tile=tw*frame.wall.scale;
 for(let x=0;x<600;x+=tile){const width=Math.min(tile,600-x);canvas.drawImageRectOptions(image,Skia.XYWHRect(tx,ty,width/frame.wall.scale,th),Skia.XYWHRect(x,780,width,th*frame.wall.scale),FilterMode.Nearest,MipmapMode.None,paint);}
 const [sx,sy,sw,sh]=frame.source,[x,y,w,h]=frame.destination;
 canvas.drawImageRectOptions(image,Skia.XYWHRect(sx,sy,sw,sh),Skia.XYWHRect(x,y,w,h),FilterMode.Nearest,MipmapMode.None,paint);
}

export function detailedMuzzle(sheet:DetailedSheet,row:number,flip:boolean,scale=1){
 'worklet';
 const pose=sheet.frames[row*sheet.columns+5],point=sheet.muzzle[row];
 return [(point[0]*pose.source[2]-pose.foot[0])*sheet.scale*scale*(flip?-1:1),(point[1]*pose.source[3]-pose.foot[1])*sheet.scale*scale*(sheet.renderScaleY??1)];
}
