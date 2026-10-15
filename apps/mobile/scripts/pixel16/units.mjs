import { create,rect,oval,line,palette } from './raster.mjs';
export const TROOPS=['sniper','sheriff','chainsaw','dog','barricade'];
export const ZOMBIES=['walker','runner','brute'];
const muzzles={ front:[28,23],back:[28,17],side:[35,24] };
function dog(c,view,kind,k,p) {
 const side=view==='side'; const leg=k%4<2?0:2;
 oval(c,20,26,side?11:7,6,p.ink); oval(c,20,25,side?10:6,5,p.gold);
 rect(c,12,28,4,10-leg,p.ink);rect(c,25,28,4,8+leg,p.ink);
 const reach=kind==='attack'&&k>=2&&k<=4?2:0;const hx=(side?29:20)+reach;oval(c,hx,18,6,7,p.ink);oval(c,hx,18,5,6,p.hairLight);
 rect(c,hx-5,11,3,6,p.hair);rect(c,hx+3,11,3,6,p.hair);
 if(view!=='back'){rect(c,hx-(side?0:3),17,2,2,p.ink);oval(c,hx+1,22,3,2,p.skin);rect(c,hx+2,21,2,2,p.ink);}
 rect(c,13,36,4,2,p.boot);rect(c,25,36,4,2,p.boot);
}
function barricade(c,k,p) {
 rect(c,5,14,30,24,p.ink);rect(c,7,16,26,20,p.hair);
 for(let y=17;y<36;y+=6){rect(c,8,y,24,2,p.hairLight);rect(c,8,y+3,24,1,p.ink);}
 line(c,7,16,32,34,p.gold);line(c,8,16,33,34,p.gold);line(c,7,34,32,16,p.gold);
 for(let x=7;x<35;x+=5){rect(c,x,12,2,3,p.steel);rect(c,x+2,10,1,3,p.steel);}
 if(k>0){line(c,22,17,18,25,p.ink);line(c,18,25,23,32,p.ink);}
}
function person(c,id,view,kind,k,p) {
 const zombie=ZOMBIES.includes(id);const side=view==='side';const back=view==='back';
 const bob=(kind==='walk'&&k%4<2)||(kind==='idle'&&k>=4)?-1:0;const lean=kind==='attack'&&k>=2&&k<=4?1:0;
 const skin=zombie?p.zombie:p.skin;const coat=id==='sniper'?p.green:id==='chainsaw'?p.red:id==='sheriff'?p.gold:id==='runner'?p.hairLight:id==='brute'?p.hair:p.blue;
 const light=id==='sniper'?p.greenLight:zombie?p.zombieShade:p.light;
 const stride=kind==='walk'?(k%8<4?-2:2):0;
 rect(c,14+stride,29,5,8,p.ink);rect(c,22-stride,29,5,8,p.ink);
 rect(c,15+stride,29,3,6,p.pants);rect(c,23-stride,29,3,6,p.pants);
 rect(c,13+stride,36,7,2,p.boot);rect(c,22-stride,36,7,2,p.boot);
 oval(c,20+lean,24+bob,id==='brute'?11:8,9,p.ink);oval(c,20+lean,24+bob,id==='brute'?10:7,8,coat);
 rect(c,15+lean,20+bob,2,10,light);rect(c,22+lean,26+bob,4,5,p.ink);
 oval(c,20+lean,12+bob,9,9,p.ink);oval(c,20+lean,12+bob,8,8,zombie?p.zombieShade:p.hair);
 oval(c,20+lean,13+bob,7,7,skin);rect(c,15+lean,9+bob,4,2,zombie?p.zombieShade:p.light);
 if(id==='sniper') {rect(c,12+lean,5+bob,13,4,p.hair);rect(c,12+lean,8+bob,4,7,p.hair);rect(c,13+lean,5+bob,8,2,p.hairLight);}
 if(id==='sheriff'){rect(c,11+lean,7+bob,19,3,p.ink);rect(c,15+lean,1+bob,10,7,p.hair);rect(c,16+lean,2+bob,8,2,p.gold);}
 if(back){rect(c,13+lean,9+bob,14,7,zombie?p.zombieShade:id==='chainsaw'?skin:p.hair);rect(c,15,22+bob,10,5,light);}
 else {
  for(const x of side?[23]:[16,23]) {rect(c,x+lean,11+bob,3,4,p.white);rect(c,x+lean+(side?2:1),12+bob,1,2,p.ink);}
  if(zombie){rect(c,17+lean,17+bob,7,2,p.ink);rect(c,18+lean,17+bob,1,1,p.white);rect(c,22+lean,18+bob,2,1,p.white);}
  else {rect(c,19+lean,18+bob,4,1,p.hair);if(id==='chainsaw')rect(c,19+lean,15+bob,3,3,p.red);}
 }
 if(zombie){const y=kind==='attack'?23:26;rect(c,10,y+bob,5,4,p.zombie);rect(c,27,y+bob,6,4,p.zombie);rect(c,13,28,4,2,p.zombieShade);}
 else {
  const recoil=kind==='attack'&&k>=3&&k<=5?-1:0;const [mx,my]=muzzles[view];
  if(back){rect(c,21,24,6,4,p.ink);rect(c,24,19,5,8,p.ink);rect(c,27,17,2,6,p.steel);}
  else {rect(c,side?16:12,23,side?19+recoil:16+recoil,3,p.ink);rect(c,side?20:14,24,side?14+recoil:13+recoil,1,p.steel);}
  rect(c,19,24+bob,4,3,skin);rect(c,25,23+bob,4,3,skin);
  if(id==='chainsaw'){rect(c,24,25,10,4,p.gold);rect(c,25,29,9,1,p.ink);}
  if(kind==='attack'&&k===3){rect(c,mx,my,4,2,p.gold);rect(c,mx+1,my-1,1,4,p.light);}
 }
}
export function unitFrame(id,view,kind,k,p=palette) {
 const canvas=create(40,40);
 if(id==='dog') dog(canvas,view,kind,k,p);
 else if(id==='barricade') barricade(canvas,kind==='idle'?Math.min(k,2):0,p);
 else person(canvas,id,view,kind,k,p);
 if(kind==='death'||kind==='down'){
  const dead=create(40,40);const progress=kind==='down'?1:(k+1)/5;
  for(let y=0;y<40;y++)for(let x=0;x<40;x++){const i=(y*40+x)*4;if(canvas.rgba[i+3])dead.put(Math.round(x*(1-progress)+(20+(y-20)*.85)*progress),Math.round(y*(1-progress)+(33-(x-20)*.25)*progress),Array.from(canvas.rgba.slice(i,i+4)));}
  return dead;
 }
 return canvas;
}
export const muzzleFor=(id,view) => ZOMBIES.includes(id)||['dog','barricade'].includes(id)?null:muzzles[view];
