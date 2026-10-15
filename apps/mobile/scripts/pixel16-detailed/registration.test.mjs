import {test} from 'node:test';
import assert from 'node:assert/strict';
import {headLandmark,registerWalk,bodyBounds} from './registration.mjs';

test('walking registration follows the body despite moving boots and adjacent-cell fragments',()=>{
 const width=256,height=96,pixels=new Uint8Array(width*height*4),frames=[];
 function fill(x,y,w,h){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)pixels[(yy*width+xx)*4+3]=255;}
 for(let row=0;row<3;row++)for(let col=0;col<8;col++){
  const dx=col%4-1,dy=col%3,left=col*32,top=row*32;
  fill(left+10+dx,top+6+dy,10,17); // contiguous head and torso
  fill(left+8+dx+col%3,top+23+dy,14,3); // changing boot positions
  fill(left+2,top,2,2); // previous row's detached fragment
  frames.push({source:[left,top,32,32],foot:[15+col,27]});
 }
 assert.deepEqual(bodyBounds(pixels,width,frames[0].source),[7,6,14,20]);
 assert.deepEqual(headLandmark(pixels,width,frames[0].source),[13.5,6]);
 registerWalk(pixels,width,frames);
 for(let row=0;row<3;row++)for(let col=0;col<4;col++){
  const frame=frames[row*8+col],head=headLandmark(pixels,width,frame.source);
  assert.deepEqual([head[0]-frame.foot[0],head[1]-frame.foot[1]],[-1.5,-21]);
 }
});
