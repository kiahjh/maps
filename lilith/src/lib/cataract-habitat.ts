import { elevationAt, rivers, riverWidthAt } from './landscape';
import { cataractWaterLevel, sampleByY } from './cataract';

// Invented, asymmetric fallen stones below the two branches. Their centres sit
// above the bed, with the underside buried and the crowns breaking the water.
const stones = [
  { branch: 1, y: 608, across: -.32, scale: 3.3, seed: .18 },
  { branch: 1, y: 617, across: .38, scale: 4.2, seed: .71 },
  { branch: 1, y: 631, across: -.46, scale: 2.9, seed: .43 },
  { branch: 2, y: 611, across: .40, scale: 3.6, seed: .85 },
  { branch: 2, y: 624, across: -.27, scale: 4.5, seed: .32 },
  { branch: 2, y: 638, across: .34, scale: 2.8, seed: .57 },
];

export const streamBoulders = stones.map(stone => {
  const river = rivers[stone.branch], centre = sampleByY(river.points, stone.y);
  const before = sampleByY(river.points, stone.y - 1), after = sampleByY(river.points, stone.y + 1);
  const length = Math.hypot(after.x - before.x, after.y - before.y);
  const current = { x: (after.x - before.x) / length, y: (after.y - before.y) / length };
  const offset = riverWidthAt(river, stone.y) * stone.across;
  const x = centre.x + current.y * offset, y = centre.y - current.x * offset;
  return { x, y, scale: stone.scale, seed: stone.seed, rootLift: stone.scale * .42,
    height: elevationAt(x, y) + stone.scale * .42, waterHeight: cataractWaterLevel(x, y),
    foamRadius: stone.scale * .83, current };
});
