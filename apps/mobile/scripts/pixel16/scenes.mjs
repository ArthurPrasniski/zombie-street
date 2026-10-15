import { create,rect,oval,line,palette as p } from './raster.mjs';
export function farm() {
 const c=create(300,450);rect(c,0,0,300,450,'#527553');rect(c,86,0,130,450,'#78916a');
 for(let y=5;y<390;y+=12)for(let x=5;x<300;x+=17){const n=(x*13+y*7)%5;rect(c,x,y,2,1,n<2?'#69905e':'#46684d');}
 rect(c,0,0,300,20,'#273d3c');rect(c,0,20,300,10,'#385846');
 for(let x=0;x<300;x+=19){rect(c,x,31,2,11,p.hair);line(c,x,32,x+19,32,p.gold);line(c,x,37,x+19,37,p.hair);}
 for(const x of [17,265])for(const y of [65,150,240,330]){rect(c,x+6,y+10,4,17,p.hair);oval(c,x+8,y+6,13,15,'#2d5548');oval(c,x+4,y+2,8,10,'#3f7153');rect(c,x+1,y-3,7,3,'#69905e');}
 rect(c,29,4,34,23,p.ink);rect(c,31,6,30,19,p.red);rect(c,26,3,40,5,p.hair);rect(c,42,13,10,13,p.ink);line(c,42,13,52,25,p.skin);
 return c;
}
export function base(damage=0) {
 const c=create(300,68);rect(c,0,0,300,68,'#555b4e');
 for(let x=0;x<300;x+=11){rect(c,x,8,10,7,p.ink);rect(c,x+1,9,8,4,p.gold);rect(c,x+2,9,4,1,p.light);}
 rect(c,108,23,84,40,p.ink);rect(c,113,21,74,42,p.green);rect(c,116,22,5,38,p.greenLight);
 rect(c,123,29,54,24,p.ink);rect(c,125,31,50,20,p.blue);rect(c,126,32,19,5,p.blueLight);rect(c,125,53,50,4,p.skin);
 rect(c,105,30,7,12,p.ink);rect(c,188,30,7,12,p.ink);rect(c,112,61,76,4,p.steel);
 rect(c,146,16,8,22,p.ink);rect(c,148,16,3,19,p.steel);rect(c,140,34,20,8,p.ink);rect(c,142,35,15,4,p.steel);
 rect(c,126,57,8,3,p.red);rect(c,168,57,8,3,p.red);
 if(damage>0){line(c,172,30,160,42,p.ink);line(c,160,42,168,50,p.ink);}
 if(damage>1){rect(c,117,43,9,11,p.hair);rect(c,178,48,8,9,p.hair);}
 if(damage>2){rect(c,138,26,23,18,p.ink);rect(c,142,22,13,12,p.red);rect(c,145,21,7,8,p.gold);}
 return c;
}
export function spell(id) {
 const c=create(40,40);
 if(id==='grenade'){oval(c,20,24,10,12,p.ink);oval(c,20,24,8,10,p.green);rect(c,13,22,14,2,p.ink);rect(c,19,14,2,20,p.greenLight);rect(c,17,9,7,6,p.ink);rect(c,18,10,11,3,p.steel);oval(c,16,10,3,3,p.gold);}
 if(id==='medkit'){rect(c,6,14,28,22,p.ink);rect(c,8,16,24,18,p.white);rect(c,15,8,10,6,p.ink);rect(c,17,10,6,4,p.steel);rect(c,18,19,5,12,p.red);rect(c,14,23,13,4,p.red);}
 if(id==='molotov'){rect(c,15,12,10,24,p.ink);rect(c,17,15,6,19,p.green);rect(c,17,23,6,9,p.gold);rect(c,17,6,6,8,p.ink);rect(c,18,7,4,5,p.white);rect(c,20,2,4,6,p.red);rect(c,21,1,2,5,p.gold);}
 return c;
}
