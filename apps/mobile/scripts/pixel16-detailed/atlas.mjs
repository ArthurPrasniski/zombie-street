import assert from 'node:assert/strict';
import {registerWalk,bodyBounds} from './registration.mjs';
/** Inspect alpha only. Source images remain byte-for-byte unchanged. */
export function inspectFrame(pixels,width,height,columns,rows,column,row) {
 return inspectRegion(pixels,width,Math.round(column*width/columns),Math.round(row*height/rows),Math.round((column+1)*width/columns),Math.round((row+1)*height/rows));
}
export function inspectRegion(pixels,width,left,top,right,bottom) {
 let minX=right,minY=bottom,maxX=-1,maxY=-1,transparent=0;
 const coverage=[];
 for(let y=top;y<bottom;y++){
  let covered=0;
  for(let x=left;x<right;x++){
   const alpha=pixels[(y*width+x)*4+3];
   // Generated alpha can retain 1–8/255 in visually transparent background pixels.
   if(alpha<=8)transparent++;
   if(alpha>48){covered++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
  }
  coverage.push(covered/(right-left));
 }
 assert(maxX>=minX&&maxY>=minY,`Empty atlas region ${left},${top}`);
 assert(transparent>(right-left)*(bottom-top)*.05,`Missing transparency in ${left},${top}`);
 const feet=[];
 for(let y=Math.max(minY,maxY-Math.max(2,Math.round((maxY-minY)*.12)));y<=maxY;y++)
  for(let x=minX;x<=maxX;x++)if(pixels[(y*width+x)*4+3]>96)feet.push(x);
 const footX=feet.length?(Math.min(...feet)+Math.max(...feet))/2:(minX+maxX)/2;
 return {source:[left,top,right-left,bottom-top],bounds:[minX,minY,maxX-minX+1,maxY-minY+1],foot:[footX-left,maxY-top+1],coverage};
}
export function unitLayout(pixels,width,height,kind,worldHeight=64) {
 const frames=Array.from({length:24},(_,index)=>inspectFrame(pixels,width,height,8,3,index%8,Math.floor(index/8)));
 for(const frame of frames){
  frame.bounds=bodyBounds(pixels,width,frame.source);
  // Register at the body's ground contact rather than a detached shadow or adjacent cell.
  const [x,y,w,h]=frame.bounds;frame.foot=[x+w/2-frame.source[0],y+h-frame.source[1]];
 }
 const heights=frames.filter((_,i)=>i%8!==7).map(frame=>frame.bounds[3]).sort((a,b)=>a-b);
 const scale=worldHeight/heights[Math.floor(heights.length/2)];
 if(kind!=='prop')registerWalk(pixels,width,frames);
 const muzzle=Array.from({length:3},(_,row)=>{
  const [x,y,w,h]=frames[row*8+5].source;const points=[];
  for(let dy=0;dy<h*.7;dy++)for(let dx=Math.floor(w*.55);dx<w;dx++){
   const at=((y+dy)*width+x+dx)*4;
   if(pixels[at]>245&&pixels[at+1]>180&&pixels[at+2]<160&&pixels[at+3]>80)points.push([dx,dy]);
  }
  return points.length?[points.reduce((sum,p)=>sum+p[0],0)/points.length/w,points.reduce((sum,p)=>sum+p[1],0)/points.length/h]:[.78,.53];
 });
 return {kind,height:worldHeight,columns:8,rows:3,scale,frames:frames.map(({source,foot,bounds})=>({source,foot,bounds})),muzzle};
}
export function baseLayout(pixels,width,height) {
 // Locate the empty gutter between the two rows; model output may shift registration.
 let best={start:0,length:0},start=-1;
 for(let y=Math.round(height*.25);y<height*.8;y++){
  let count=0;for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>48)count++;
  if(count<8){if(start<0)start=y;}
  else if(start>=0){if(y-start>best.length)best={start,length:y-start};start=-1;}
 }
 assert(best.length>8,'Missing transparent gutter between base rows');
 const split=Math.round(best.start+best.length/2);
 const frames=Array.from({length:4},(_,i)=>inspectRegion(pixels,width,Math.round((i%2)*width/2),i<2?0:split,Math.round((i%2+1)*width/2),i<2?split:height));
 return {frames:frames.map(frame=>{
  const wallRow=frame.coverage.findIndex(value=>value>.65);
  assert(wallRow>=0,'Sandbag wall must span at least 65% of its cell');
  const wallY=frame.source[1]+wallRow;
  const [x,y,w,h]=frame.bounds;
  const scale=Math.min(600/w,120/Math.max(1,y+h-wallY));
  return {source:[x,y,w,h],destination:[(600-w*scale)/2,780-(wallY-y)*scale,w*scale,h*scale],wall:{source:[frame.source[0]+Math.round(frame.source[2]*.22),wallY,Math.round(frame.source[2]*.22),Math.round(18/scale)],scale}};
 })};
}
