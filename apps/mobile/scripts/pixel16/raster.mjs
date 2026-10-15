import { PixelCanvas, hex } from '../art-pixel/canvas.mjs';
export const create = (w,h) => new PixelCanvas(w,h);
export function rect(c,x,y,w,h,color) { const rgba=hex(color); for(let j=Math.floor(y);j<Math.ceil(y+h);j++) for(let i=Math.floor(x);i<Math.ceil(x+w);i++) c.put(i,j,rgba); }
export function oval(c,x,y,rx,ry,color) { const rgba=hex(color); for(let j=Math.floor(y-ry);j<=y+ry;j++) for(let i=Math.floor(x-rx);i<=x+rx;i++) if(((i-x)/rx)**2+((j-y)/ry)**2<=1) c.put(i,j,rgba); }
export function line(c,x,y,x1,y1,color) { c.line(x,y,x1,y1,hex(color)); }
export const palette = { ink:'#171b2c',shade:'#303245',skin:'#dda574',light:'#ffe1aa',hair:'#8c4e32',hairLight:'#cb8152',green:'#47835e',greenLight:'#80b66a',blue:'#4d84ae',blueLight:'#8bb5d3',red:'#b74d59',gold:'#d4a454',steel:'#a0b8c1',white:'#f2edda',zombie:'#94ab68',zombieShade:'#627a52',pants:'#414963',boot:'#282838' };
export const retroPalette = { ...palette,skin:'#bd9671',green:'#626b42',greenLight:'#8b9560',blue:'#5e7383',blueLight:'#98a4a4',red:'#965952',gold:'#a7905b',zombie:'#8e986b' };
