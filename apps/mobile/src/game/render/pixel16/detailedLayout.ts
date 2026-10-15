/** Metadata measured from immutable source PNGs; these functions never touch world coordinates. */
export interface DetailedSheet {
 kind:string;scale:number;columns:number;rows:number;height?:number;renderScaleY?:number;
 frames:{source:number[];foot:number[];bounds:number[]}[];
 muzzle:number[][];
}
export interface DetailedBase {frames:{source:number[];destination:number[];wall:{source:number[];scale:number}}[]}
export interface DetailedLayouts {viewportHeight?:number;base:DetailedBase;units:Partial<Record<string,DetailedSheet>>}
// Three authored poses span one full stride; hold each for two distance steps.
const WALK=[1,1,2,2,3,3,2,2];
const ATTACK=[0,4,4,5,6,6,0,0];
/** Adapt existing animation timing to the smaller prototype's authored poses. */
export function detailedFrame(sheet:DetailedSheet,index:number,row:number) {
 'worklet';
 let column=0;
 if(sheet.kind==='prop')column=index>=16?7:Math.min(2,index);
 else if(sheet.kind==='zombie')column=index>=16?7:index>=8?ATTACK[index-8]??0:WALK[index]??0;
 else column=index>=17?WALK[index-17]??0:index===16?7:index>=8?ATTACK[index-8]??0:0;
 return sheet.frames[Math.max(0,Math.min(sheet.rows-1,row))*sheet.columns+column];
}
