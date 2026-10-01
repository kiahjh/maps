import draft from '../map-layout.json';
import type { Point } from '../types';

// Physical metres. Every bearing, contour and coordinate is an interpretation;
// docs/world-geography-study.md and research/world-scale-plan.json keep the evidence.
export const bounds = { minX: draft.origin.x, minY: draft.origin.y,
  maxX: draft.origin.x + draft.width, maxY: draft.origin.y + draft.height };
export const anchor = (id: string) => draft.places.find(p => p.id === id)!;
export const forestBoundary: Point[] = [
  {x:10500,y:-4700},{x:18100,y:-7400},{x:28000,y:3300},
  {x:34400,y:12200},{x:36500,y:23400},{x:37700,y:32500},
  {x:38200,y:43300},{x:30500,y:46200},{x:19900,y:44300},
  {x:15000,y:38900},{x:14500,y:33200},{x:19300,y:24500},
  {x:16100,y:14200},{x:11000,y:7700},
];
export const evilBoundary: Point[] = [
  {x:-2800,y:27200},{x:1000,y:26700},{x:3900,y:29000},
  {x:5300,y:33800},{x:3400,y:39100},{x:300,y:41200},
  {x:-3900,y:39500},{x:-5800,y:35700},{x:-4500,y:31000},
];
export const riverRoutes = {
  upper: [{x:-6000,y:-52300},{x:-5700,y:-48700},{x:-10500,y:-39300},
    {x:-6000,y:-31000},{x:-6000,y:-23000},{x:2300,y:-17300},
    {x:-3500,y:-10200},{x:3100,y:-5000},{x:1100,y:-1400}],
  first: [{x:-900,y:2700},{x:-5500,y:9000},{x:-10500,y:17000},
    {x:-13000,y:27000},{x:-12800,y:31000},{x:-11500,y:35200},
    {x:-17400,y:40500},{x:-22500,y:36000}],
  second: [{x:2100,y:2800},{x:4400,y:8300},{x:8000,y:16500},
    {x:10300,y:24500},{x:10600,y:33400},{x:14900,y:40100},
    {x:19000,y:39000}],
  hot: [{x:36500,y:23400},{x:36600,y:24500},{x:37300,y:30000},
    {x:37900,y:36000},{x:38200,y:43800}],
};

// Secondary water-runs reconnect to their branch; they do not imply measured
// drainage maps. Their width is physical, not widened for screen visibility.
export const braidRoutes = [
  {id:'first-run-a',parent:'first',width:24,points:[{x:-5500,y:9000},{x:-8900,y:14900},{x:-8700,y:21000},{x:-13000,y:27000}]},
  {id:'first-run-b',parent:'first',width:35,points:[{x:-10500,y:17000},{x:-15100,y:21800},{x:-14700,y:27200},{x:-12800,y:31000}]},
  {id:'first-run-c',parent:'first',width:28,points:[{x:-12800,y:31000},{x:-15300,y:34800},{x:-14200,y:38500},{x:-17400,y:40500}]},
  {id:'second-run-a',parent:'second',width:28,points:[{x:4400,y:8300},{x:9100,y:12300},{x:9800,y:19400},{x:10300,y:24500}]},
  {id:'second-run-b',parent:'second',width:32,points:[{x:10300,y:24500},{x:7900,y:29000},{x:8700,y:33300},{x:10600,y:33400}]},
  {id:'second-run-c',parent:'second',width:40,points:[{x:10600,y:33400},{x:13900,y:35900},{x:17700,y:35200},{x:19000,y:39000}]},
];
export const basins = [
  {id:'orchard',x:19000,y:39000,rx:4300,ry:3100,level:16.7},
  {id:'bad-burrow',x:-22500,y:36000,rx:2000,ry:1500,level:13.3},
];

// Route corridors let repeated journeys be checked against one ground layout.
// These are inferred paths, not roads. They are not painted onto the landscape.
export const journeys = [
  {id:'ridge-to-wood',from:'low-hills',to:'evil-wood',points:[anchor('low-hills'),{x:-15400,y:30000},{x:-9200,y:30800},anchor('evil-wood')]},
  {id:'wood-to-valley',from:'evil-wood',to:'orchard',points:[anchor('evil-wood'),{x:5400,y:34800},{x:10700,y:35900},anchor('orchard')]},
  {id:'mara-to-falls',from:'mara',to:'cataract',points:[anchor('mara'),{x:7000,y:16600},{x:4400,y:8300},{x:2300,y:3400},anchor('cataract')]},
  {id:'falls-to-forest',from:'cataract',to:'guide-forest',points:[anchor('cataract'),{x:1800,y:-1500},anchor('guide-forest')]},
  {id:'hall-to-nests',from:'ivy-hall',to:'nests',points:[anchor('ivy-hall'),{x:27100,y:27000},anchor('nests')]},
  {id:'nests-to-mara',from:'nests',to:'mara',points:[anchor('nests'),{x:27100,y:31500},{x:24000,y:25500},{x:12100,y:28500},anchor('mara')]},
  {id:'mara-to-ridge',from:'mara',to:'low-hills',points:[anchor('mara'),{x:-4900,y:26700},{x:-13000,y:31200},anchor('low-hills')]},
  {id:'stream-to-city',from:'hot-stream',to:'bulika',points:[anchor('hot-stream'),{x:47800,y:25800},anchor('bulika')]},
];
export function pathLength(points: Point[]) {
  return points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-points[i].x,p.y-points[i].y),0);
}
