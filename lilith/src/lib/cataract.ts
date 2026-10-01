import { noise, smooth } from './terrain-math';
import type { Point } from '../types';

// Local physical dimensions, in metres. Heights/widths are interpretations,
// not measurements supplied by MacDonald. Surrounding map placement is a draft.
export const cataract = {
  x: 890, lip: 592, foot: 600, upperWater: 74, lowerWater: 36,
  drop: 38, upstreamWidth: 40, westWidth: 22, eastWidth: 26,
  scaleFigureHeight: 1.8,
};
export const ascent = [
  { x: 1020, y: 678, height: 39 }, { x: 1046, y: 651, height: 45 },
  { x: 1060, y: 625, height: 53 }, { x: 1052, y: 601, height: 61 },
  { x: 1036, y: 577, height: 70 }, { x: 1007, y: 556, height: 77 },
];
export function ascentAt(x: number, y: number) {
  let distance = Infinity, height = 0;
  for (let i = 1; i < ascent.length; i++) {
    const a = ascent[i - 1], b = ascent[i], dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy)));
    const d = Math.hypot(x - a.x - t * dx, y - a.y - t * dy);
    if (d < distance) { distance = d; height = a.height + (b.height - a.height) * t; }
  }
  return { distance, height };
}
export function cataractWaterLevel(_x: number, y: number) {
  const drop = smooth(cataract.lip, cataract.foot, y);
  return cataract.upperWater - cataract.drop * drop - Math.max(0, y - cataract.foot) * .018;
}
export function cataractGround(x: number, y: number, distance: number, halfWidth: number, channelY = y) {
  // Align the water and its carved bed through the falls; the flanking scarps
  // recede independently. This prevents water strips disappearing into rock.
  const bank = 1 - smooth(halfWidth * .95, halfWidth + 9, distance);
  const flank = (noise(x / 37, 3) - .5) * 38 + (noise(x / 13, 8) - .5) * 9;
  const line = cataract.lip + flank * (1 - bank);
  const fracture = (noise(x / 11, 5) - .5) * 7;
  const ledges = .57 * (1 - smooth(line, line + 2.8, y))
    + .29 * (1 - smooth(line + 6 + fracture, line + 9 + fracture, y))
    + .14 * (1 - smooth(line + 16 - fracture, line + 20 - fracture, y));
  const profile = ledges * (1 - bank) + (1 - smooth(cataract.lip, cataract.foot, y)) * bank;
  const rock = noise(x / 12, y / 19) * 1.7 + noise(x / 3.2, y / 4.2) * .45 + (noise(x / 7, y / 3.7) - .5) * 4 * (1 - bank) * (1 - smooth(8, 22, Math.abs(y - line - 7)));
  const apron = Math.exp(-(((y - line - 24) / 15) ** 2)) * (2 + noise(x / 8, y / 11) * 3);
  let height = 38 + profile * 38 + rock + apron + (noise(x / 35, y / 37) - .5) * 4 * (1 - bank);
  // Break the exposed abutments into integral rock ledges and recesses. Keep
  // the riverbed and the broader scaur intact; these are not attached boulders.
  const nearFalls = (1 - smooth(45, 115, Math.abs(x - cataract.x)))
    * (1 - smooth(28, 55, Math.abs(y - cataract.foot)));
  const exposedFace = (1 - smooth(13, 31, Math.abs(y - line - 6)))
    * smooth(halfWidth + .5, halfWidth + 8, distance) * (1 - bank);
  const fractured = (noise(x / 9.2, y / 5.8) - .5) * 5
    + (noise(x / 3.4, y / 2.7) - .5) * 1.2
    - Math.pow(Math.abs(Math.sin(x * .19 + noise(x / 17, y / 12) * 2)), 12) * 1.4;
  height += fractured * exposedFace * nearFalls;
  const bed = cataractWaterLevel(x, channelY) - (channelY < cataract.lip ? 3.5 : 2.4);
  height = height * (1 - bank) + bed * bank;
  const route = ascentAt(x, y), routeMask = 1 - smooth(3, 28, route.distance);
  height = height * (1 - routeMask) + (route.height + noise(x * 2, y * 2) * .09) * routeMask;
  return { height, sandFill: y < cataract.lip ? bank * (6 + rock) : 0,
    moss: smooth(602, 608, y) * Math.max((1 - smooth(2, 15, Math.abs(distance - halfWidth - 3))) * (1 - smooth(16, 45, Math.abs(y - cataract.foot - 12))), (1 - smooth(.45, 1, Math.hypot((x - 990) / 65, (y - 626) / 20))) * smooth(halfWidth + 2, halfWidth + 8, distance)),
    cliff: 1 - smooth(9, 23, Math.abs(y - line - 9)),
    talus: Math.exp(-(((y - line - 22) / 21) ** 2)), route: route.distance,
  };
}
export function sampleByY(points: Point[], y: number): Point {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    if (y >= a.y && y <= b.y) {
      const t = (y - a.y) / Math.max(.001, b.y - a.y);
      return { x: a.x + (b.x - a.x) * t, y };
    }
  }
  return y < points[0].y ? points[0] : points[points.length - 1];
}
