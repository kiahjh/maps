import { describe, expect, it } from 'vitest';
import { elevationAt, fork, nearestRiver, rivers, terrainSample } from './landscape';

describe('connected landscape', () => {
  it('joins the upstream river to exactly two branches at one cataract', () => {
    const upper = rivers.find(river => river.id === 'upper')!;
    expect(upper.points.at(-1)).toEqual(fork);
    const branches = rivers.filter(river => ['first', 'second'].includes(river.id));
    expect(branches).toHaveLength(2);
    for (const branch of branches) expect(branch.points[0]).toEqual(fork);
    const west = branches[0].points.find(point => point.y > 1100)!;
    const east = branches[1].points.find(point => point.y > 1100)!;
    expect(west.x).toBeLessThan(820);
    expect(east.x).toBeGreaterThan(820);
    expect(terrainSample(820, 1110).evil).toBeGreaterThan(.9);
  });
  it('keeps the downstream rock beds fixed and fills the upper course with sand in dry mode', () => {
    expect(elevationAt(890, 555, 'dry')).toBeGreaterThan(elevationAt(890, 555, 'restored') + 5);
    expect(elevationAt(890, 625, 'dry')).toBeCloseTo(elevationAt(890, 625, 'restored'));
    expect(elevationAt(890, 560) - elevationAt(890, 640)).toBeGreaterThan(25);
    const hot = rivers.find(river => river.id === 'hot')!;
    expect(hot.alwaysWet).toBe(true);
    expect(hot.points[0]).not.toEqual(fork);
  });
  it('produces finite elevations across the country and carves each sampled channel', () => {
    for (let y = 0; y <= 1500; y += 30) for (let x = 0; x <= 2240; x += 30) {
      expect(Number.isFinite(elevationAt(x, y))).toBe(true);
    }
    for (const river of rivers) for (const point of river.points) {
      expect(nearestRiver(point.x, point.y).distance).toBeLessThan(.0001);
    }
  });
});
