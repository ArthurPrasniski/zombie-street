import { Canvas,createPicture,FilterMode,MipmapMode,Picture,Skia,type SkImage } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import detailed from '@/assets/pixel16-detailed/manifest.json';
/** The portrait samples the atlas directly; no image is destructively cropped. */
export function DetailedPortrait({image,size}:{image:SkImage|null;size:number}) {
 const picture=useMemo(()=>createPicture(canvas=>{
  if(!image)return;
  const [x,y,w,h]=detailed.layouts.sniper.frames[0].bounds;const scale=Math.min(size/w,size/h);
  canvas.drawImageRectOptions(image,Skia.XYWHRect(x,y,w,h),Skia.XYWHRect((size-w*scale)/2,(size-h*scale)/2,w*scale,h*scale),FilterMode.Nearest,MipmapMode.None);
 },Skia.XYWHRect(0,0,size,size)),[image,size]);
 return <Canvas style={{width:size,height:size}}><Picture picture={picture}/></Canvas>;
}
