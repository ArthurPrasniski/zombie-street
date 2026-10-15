/** Find the main opaque character, ignoring halos and fragments from adjacent cells. */
function mainComponent(pixels,width,source) {
 const [left,top,w,h]=source,visited=new Uint8Array(w*h);
 let largest=[];
 for(let at=0;at<w*h;at++){
  if(visited[at]||pixels[((top+Math.floor(at/w))*width+left+at%w)*4+3]<160)continue;
  const component=[],queue=[at];visited[at]=1;
  for(let cursor=0;cursor<queue.length;cursor++){
   const point=queue[cursor],x=point%w,y=Math.floor(point/w);component.push(point);
   for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){
    const xx=x+dx,yy=y+dy,next=yy*w+xx;
    if(xx<0||xx>=w||yy<0||yy>=h||visited[next])continue;
    visited[next]=1;
    if(pixels[((top+yy)*width+left+xx)*4+3]>=160)queue.push(next);
   }
  }
  if(component.length>largest.length)largest=component;
 }
 if(!largest.length)throw new Error('Missing opaque character for registration');
 return largest;
}
/** Body bounds exclude detached fragments spilled from a neighboring cell. */
export function bodyBounds(pixels,width,source) {
 const [left,top,w,h]=source,points=mainComponent(pixels,width,source);
 let x=w,y=h,right=0,bottom=0;
 for(const point of points){const xx=point%w,yy=Math.floor(point/w);x=Math.min(x,xx);y=Math.min(y,yy);right=Math.max(right,xx);bottom=Math.max(bottom,yy);}
 return [left+x,top+y,right-x+1,bottom-y+1];
}
export function headLandmark(pixels,width,source) {
 const w=source[2],h=source[3],largest=mainComponent(pixels,width,source);
 let minY=h,maxY=0;
 for(const point of largest){const y=Math.floor(point/w);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
 const height=maxY-minY+1;let minX=w,maxX=0;
 for(const point of largest){
  const y=Math.floor(point/w);
  if(y>=minY+height*.06&&y<=minY+height*.2){minX=Math.min(minX,point%w);maxX=Math.max(maxX,point%w);}
 }
 return [(minX+maxX)/2,minY];
}

/** Register gait to the idle body's head, never to whichever boot is planted. */
export function registerWalk(pixels,width,frames) {
 for(let row=0;row<3;row++){
  const idle=frames[row*8],origin=headLandmark(pixels,width,idle.source);
  for(let column=1;column<=3;column++){
   const frame=frames[row*8+column],head=headLandmark(pixels,width,frame.source);
   frame.foot=[idle.foot[0]+head[0]-origin[0],idle.foot[1]+head[1]-origin[1]];
  }
 }
}
