import { waterways } from '../data/terrain';
import type { Landscape, Point } from '../types';

import { fractal, noise, smooth } from './terrain-math';
import { cataract, cataractGround } from './cataract';
import { anchor, basins, braidRoutes, evilBoundary, forestBoundary, riverRoutes } from '../data/world-geography';
export { fractal, hash, noise, smooth } from './terrain-math';
// Both local geometry and regional coordinates use metres; geography is interpretive.
export const fork = { x: 890, y: 587 };

// Sample the canonical cubic SVG paths as world geometry; rendering no longer
// draws them as SVG strokes. S reflects the preceding control point.
export function samplePath(path: string, steps = 28): Point[] {
  const tokens = path.match(/[MCS]|-?\d+(?:\.\d+)?/g)!;
  let index = 0, current = { x: 0, y: 0 }, control = current;
  const points: Point[] = [];
  const point = () => ({ x: Number(tokens[index++]), y: Number(tokens[index++]) });
  while (index < tokens.length) {
    const command = tokens[index++];
    if (command === 'M') { current = point(); control = current; points.push(current); continue; }
    const a = current;
    const b = command === 'S' ? { x: a.x * 2 - control.x, y: a.y * 2 - control.y } : point();
    const c = point(), d = point();
    for (let i = 1; i <= steps; i++) {
      const t = i / steps, s = 1 - t;
      points.push({ x: s ** 3 * a.x + 3 * s * s * t * b.x + 3 * s * t * t * c.x + t ** 3 * d.x,
        y: s ** 3 * a.y + 3 * s * s * t * b.y + 3 * s * t * t * c.y + t ** 3 * d.y });
    }
    current = d; control = c;
  }
  return points;
}
export interface River {
  id: string; points: Point[]; width: number; alwaysWet?: boolean; upper?: boolean;
  parent?: string; length: number; outlet?: number;
}
// Smooth regional routes, retaining the original lip and immediate river beds.
// Cardinal axes and the long courses are editorial; the fork is textual.
function curve(points: Point[], subdivisions = 12): Point[] {
  return points.flatMap((a,i)=>{
    const b=points[i+1];if(!b)return [a];
    const p=points[Math.max(0,i-1)],q=points[Math.min(points.length-1,i+2)];
    return Array.from({length:subdivisions},(_,j)=>{
      const t=j/subdivisions,t2=t*t,t3=t2*t;
      const cubic=(p:number,a:number,b:number,q:number)=>.5*((2*a)+(-p+b)*t+(2*p-5*a+4*b-q)*t2+(-p+3*a-3*b+q)*t3);
      return {x:cubic(p.x,a.x,b.x,q.x),y:cubic(p.y,a.y,b.y,q.y)};
    });
  });
}
function river(id:string,points:Point[],width:number,options:Partial<River>={}):River {
  const length=points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-points[i].x,p.y-points[i].y),0);
  return {id,points,width,length,...options};
}
const oldUpper=[{x:1120,y:-450},{x:1110,y:-280},{x:1080,y:-80},...samplePath(waterways.upper)];
const oldFirst=samplePath(waterways.first).filter(p=>p.y<880);
const oldSecond=samplePath(waterways.second).filter(p=>p.y<880);
export const rivers:River[]=[
  river('upper',[...curve([...riverRoutes.upper,oldUpper[0]]).slice(0,-1),...oldUpper],20,{upper:true}),
  river('first',[...oldFirst,...curve([oldFirst.at(-1)!,...riverRoutes.first]).slice(1)],11,{outlet:basins[1].level}),
  river('second',[...oldSecond,...curve([oldSecond.at(-1)!,...riverRoutes.second]).slice(1)],13,{outlet:basins[0].level}),
  river('hot',curve(riverRoutes.hot),1.8,{alwaysWet:true,outlet:26}),
  ...braidRoutes.map(r=>river(r.id,curve(r.points),r.width,{parent:r.parent})),
];
export function riverWidthAt(river:River,y:number) {
  if(river.alwaysWet||river.parent)return river.width;
  const mouth=river.id==='first'||river.id==='second'?1-smooth(587,650,y):0;
  const localWidth=river.width*(1-mouth)+cataract.upstreamWidth/2*mouth;
  const far=river.upper?smooth(900,18000,587-y):smooth(900,16000,y-587);
  return localWidth*(1-far)+(river.upper?105:river.id==='first'?100:125)*far;
}
interface Segment {a:Point;dx:number;dy:number;lengthSquared:number;along:number;river:River}
const segments:Segment[]=rivers.flatMap(river=>{
  let along=0;
  return river.points.slice(1).map((b,i)=>{
    const a=river.points[i],dx=b.x-a.x,dy=b.y-a.y,lengthSquared=dx*dx+dy*dy;
    const segment={a,dx,dy,lengthSquared,along,river};along+=Math.sqrt(lengthSquared);return segment;
  });
});
const cellSize=1000,influence=3000;
const riverCells=new Map<string,Segment[]>();
for(const segment of segments){
  const bx=segment.a.x+segment.dx,by=segment.a.y+segment.dy;
  for(let y=Math.floor((Math.min(segment.a.y,by)-influence)/cellSize);y<=Math.floor((Math.max(segment.a.y,by)+influence)/cellSize);y++)
    for(let x=Math.floor((Math.min(segment.a.x,bx)-influence)/cellSize);x<=Math.floor((Math.max(segment.a.x,bx)+influence)/cellSize);x++){
      const key=`${x},${y}`,cell=riverCells.get(key)??[];cell.push(segment);riverCells.set(key,cell);
    }
}
export function nearestRiver(x:number,y:number,id?:string){
  let squared=Infinity,river=rivers.find(r=>r.id===id)??rivers[0],channelY=y,channelX=x,along=0;
  for(const segment of riverCells.get(`${Math.floor(x/cellSize)},${Math.floor(y/cellSize)}`)??[]){
    if(id&&segment.river.id!==id)continue;
    const dx=x-segment.a.x,dy=y-segment.a.y;
    const t=Math.max(0,Math.min(1,(dx*segment.dx+dy*segment.dy)/Math.max(.000001,segment.lengthSquared)));
    const d=(dx-t*segment.dx)**2+(dy-t*segment.dy)**2;
    if(d<squared){squared=d;river=segment.river;channelY=segment.a.y+t*segment.dy;channelX=segment.a.x+t*segment.dx;along=segment.along+t*Math.sqrt(segment.lengthSquared);}
  }
  return {distance:Math.sqrt(squared),river,channelY,channelX,along,halfWidth:riverWidthAt(river,channelY)};
}
export function mountainHeight(x:number,y:number){
  const peak=anchor('book-door');
  const main=Math.exp(-(((x-peak.x)/7200)**2+((y-peak.y)/7500)**2));
  const shoulder=Math.exp(-(((x-peak.x-4000)/5600)**2+((y-peak.y+2300)/5500)**2));
  return main*1480+shoulder*380;
}
export function regionalWaterLevel(river:River,x:number,y:number,along?:number):number {
  if(river.parent){const parent=nearestRiver(x,y,river.parent);return regionalWaterLevel(parent.river,parent.channelX,parent.channelY,parent.along);}
  if(river.upper)return 74+Math.max(0,169-y)*.0016+mountainHeight(x,y)*.93;
  const progress=Math.max(0,Math.min(1,((along??nearestRiver(x,y,river.id).along)-700)/Math.max(1,river.length-700)));
  return (river.alwaysWet?34.5:29)*(1-progress)+(river.outlet??16)*progress;
}
// The first detail pass is feathered into the existing world around the falls.
export function cataractZone(x: number, y: number) {
  return 1 - smooth(.55, 1, Math.hypot((x - fork.x) / 310, (y - 620) / 260));
}
export const scarpLine = (x: number) => {
  const local = 1 - smooth(180, 320, Math.abs(x - fork.x));
  const recess = (noise(x / 38, 4) - noise(fork.x / 38, 4)) * 43;
  return 594 + 13 * Math.sin((x - fork.x) / 90) + 4 * Math.sin((x - fork.x) / 18)
    + .00014 * (x - fork.x) ** 2 + local * recess;
};
function ellipse(x: number, y: number, cx: number, cy: number, rx: number, ry: number) {
  return Math.hypot((x - cx) / rx, (y - cy) / ry);
}
function oldWoodland(x: number, y: number) {
  const edge = (noise(x / 42, y / 42) - .5) * .24;
  const evil = 1 - smooth(.78, 1.08, ellipse(x, y, 825, 1130, 132, 174) + edge);
  const eastern = 1 - smooth(.65, 1.12, ellipse(x, y, 1455, 1085, 303, 421) + edge);
  const pine = 1 - smooth(.68, 1.05, ellipse(x, y, 265, 600, 145, 120) + edge);
  return { evil, forest: Math.max(evil, eastern, pine) };
}
function oldTerrainSample(x: number, y: number) {
  const nearest = nearestRiver(x, y), d = nearest.distance, width = nearest.halfWidth;
  const line = scarpLine(x), local = cataractZone(x, y);
  const originalPlateau = 1 - smooth(line - 7, line + 17, y);
  // Unequal shelves, recessed faces and a rubble apron replace the single ramp.
  const ledge = (noise(x / 24, 9) - .5) * 9;
  const shelves = .55 * (1 - smooth(line - 12 + ledge, line + 1 + ledge, y))
    + .29 * (1 - smooth(line + 8 - ledge, line + 21 - ledge, y))
    + .16 * (1 - smooth(line + 33, line + 58, y));
  const plateau = originalPlateau * (1 - local) + shelves * local;
  const scarp = Math.exp(-(((x - 890) / 480) ** 4));
  const broad = fractal(x / 110, y / 110), detail = fractal(x / 28, y / 28);
  const valley = Math.exp(-((d / 75) ** 2));
  const channel = 1 - smooth(width * .55, width * 1.7, d);
  const carved = channel * 12 + valley * 9;
  const ridge = Math.pow(Math.abs(noise(x / 66, y / 90) - .5) * 2, 2) * 38;
  const ravines = smooth(640, 720, y) * (1 - smooth(950, 1050, y)) * Math.exp(-(((x - 850) / 260) ** 2));
  const face = (1 - smooth(48, 90, Math.abs(y - line))) * local;
  const relief = (noise(x / 5.5, y / 9) - .5) * 3.5 * face;
  const originalTalus = local * Math.exp(-(((y - line - 68) / 30) ** 2));
  const originalMoss = local * (1 - smooth(20, 65, Math.abs(y - line - 62)))
    * (.35 + noise(x / 13, y / 17) * .65) * (1 - smooth(5, 24, d));
  const originalHeight = relief + originalTalus * (4 + noise(x / 15, y / 11) * 7) + 28 + (1500 - y) * .017 + (broad - .5) * 31 + (detail - .5) * 8
    + originalPlateau * scarp * 38 + ravines * ridge - carved;
  const close = cataractGround(x, y, d, width, nearest.channelY);
  const height = originalHeight * (1 - local) + close.height * local;
  const sandFill = (nearest.river.upper ? carved * plateau : 0) * (1 - local) + close.sandFill * local;
  const wood = oldWoodland(x, y);
  const sand = plateau * scarp;
  const bank = Math.exp(-(((d - width - 10) / 35) ** 2));
  const regrowth = Math.max(sand * .8, bank * .9);
  const originalCliff = (1 - smooth(13, 43 + local * 35, Math.abs(y - line - local * 10))) * scarp;
  const cliff = originalCliff * (1 - local) + close.cliff * local;
  const talus = originalTalus * (1 - local) + close.talus * local;
  const moss = originalMoss * (1 - local) + close.moss * local;
  return { height, sandFill, sand, bank, channel, valley, cliff, local, talus, moss, ...wood, wetForest: wood.forest, regrowth, distance: d, river: nearest.river, broad, detail, plateau };
}
function polygonMask(x:number,y:number,points:Point[],feather:number){
  let inside=false,distance=Infinity;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const a=points[i],b=points[j];
    if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
    const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));
    distance=Math.min(distance,Math.hypot(x-a.x-t*dx,y-a.y-t*dy));
  }
  return smooth(-feather,feather,inside?distance:-distance);
}
export function woodland(x:number,y:number){
  const wx=x+(noise(x/1700,y/2100)-.5)*850,wy=y+(noise(x/1400+9,y/1900)-.5)*850;
  const evil=polygonMask(wx,wy,evilBoundary,700),forest=polygonMask(wx,wy,forestBoundary,950);
  const pine=1-smooth(.72,1.1,ellipse(x,y,-28900,28900,1900,1400));
  return {evil,forest:Math.max(evil,forest,pine)};
}
function regionalSample(x:number,y:number){
  const nearest=nearestRiver(x,y),d=nearest.distance,w=nearest.halfWidth;
  const broad=fractal(x/4400,y/4800),detail=fractal(x/600,y/650);
  const plateau=1-smooth(400,2300,y);
  const mountain=mountainHeight(x,y);
  const ridge=125*Math.exp(-(((x+18500)/5100)**2+((y-35000)/1500)**2));
  const palace=48*Math.exp(-(((x-63090)/340)**2+((y-24750)/390)**2));
  let height=34+plateau*42+Math.max(0,-y)*.0016+(broad-.5)*52+(detail-.5)*8+mountain+ridge+palace;
  const basinEdge=(noise(x/1100,y/1400)-.5)*.12;
  for(const basin of basins){
    const radius=ellipse(x,y,basin.x,basin.y,basin.rx,basin.ry)+basinEdge;
    const bowl=1-smooth(.25,1.15,radius);
    height=height*(1-bowl)+(basin.level-9+radius*radius*5)*bowl;
  }
  const wood=woodland(x,y);
  const belt=nearest.river.upper?950:nearest.river.alwaysWet?110:1800;
  const valley=1-smooth(w+60,w+belt,d);
  const channel=1-smooth(w*.9,w+Math.max(8,w*.35),d);
  const level=regionalWaterLevel(nearest.river,nearest.channelX,nearest.channelY,nearest.along);
  // Broad, gently graded valleys connect the channel beds to the country.
  const banks=level+3+noise(x/170,y/210)*3;
  height=height*(1-valley*.88)+banks*valley*.88;
  height=height*(1-channel)+(level-(nearest.river.alwaysWet?2.3:5))*channel;
  const sandFill=nearest.river.upper?channel*8:0;
  const sand=(1-wood.forest)*Math.max(plateau,.48*Math.exp(-(((x-3500)/13000)**2+((y-23000)/14500)**2)));
  const upperForest=1-smooth(.68,1.12,ellipse(x,y,-5300,-29000,16300,18900)+(noise(x/3000,y/3800)-.5)*.2);
  const bank=Math.exp(-(((d-w-25)/100)**2));
  return {height,sandFill,sand,bank,channel,valley,cliff:0,local:0,talus:0,moss:0,
    ...wood,wetForest:Math.max(wood.forest,upperForest),regrowth:Math.max(sand*.8,bank*.9),distance:d,river:nearest.river,broad,detail,plateau};
}
export function terrainSample(x:number,y:number){
  const retained=1-smooth(420,1600,Math.hypot(x-fork.x,y-620));
  if(retained===1)return oldTerrainSample(x,y);
  const regional=regionalSample(x,y);
  if(retained===0)return regional;
  const old=oldTerrainSample(x,y);
  const sample={...regional};
  for(const key of ['height','sandFill','sand','bank','channel','valley','cliff','local','talus','moss','evil','forest','wetForest','regrowth','broad','detail','plateau'] as const)
    sample[key]=regional[key]*(1-retained)+old[key]*retained;
  return sample;
}
export function elevationAt(x: number, y: number, landscape: Landscape = 'restored') {
  const sample = terrainSample(x, y);
  return sample.height + (landscape === 'dry' ? sample.sandFill : 0);
}
