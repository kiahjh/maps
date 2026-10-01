import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { cameraPose, flyFov, overview, toScreen } from './camera';
import { enterFlight, flightClearance, safeFlight, stepFlight } from './flyover';
import type { Camera } from '../types';
import { elevationAt } from './landscape';

const size = { width: 1000, height: 700 };
describe('flyover inspection', () => {
  it('enters perspective flight looking at the same selected place', () => {
    const point = { x: 890, y: 580 };
    const elevation = elevationAt(point.x, point.y, 'restored');
    for (const tilt of [0, 55, 65]) {
    const view = { ...overview, ...point, elevation, tilt, zoom: 5.4 };
    const flight = enterFlight(view, size, 'restored');
    const screen = toScreen(point, flight, size, elevation);
    expect(screen.x).toBeCloseTo(size.width / 2);
    expect(screen.y).toBeCloseTo(size.height / 2);
    expect(flight.elevation).toBeGreaterThan(elevation + flightClearance);
    }
  });
  it('projects markers like Three.js at different flight headings, including above the horizon', () => {
    for (const bearing of [0, -90, 180, 270]) for (const tilt of [30, 80, 105]) {
      const view = { ...overview, fly: true, x: 890, y: 700, elevation: 250, bearing, tilt };
      const pose = cameraPose(view), camera = new PerspectiveCamera(flyFov, size.width / size.height, .5, 12000);
      camera.position.set(...pose.position); camera.up.set(...pose.up); camera.lookAt(...pose.target); camera.updateMatrixWorld();
      const point = new Vector3(...pose.target).sub(camera.position).multiplyScalar(100).add(camera.position);
      point.add(new Vector3(4, 3, 6));
      const actual = point.clone().project(camera);
      const screen = toScreen({ x: point.x, y: point.z }, view, size, point.y);
      expect(screen.x).toBeCloseTo((actual.x + 1) * size.width / 2);
      expect(screen.y).toBeCloseTo((1 - actual.y) * size.height / 2);
      const behind = new Vector3(...pose.position).sub(new Vector3(...pose.target).sub(camera.position).multiplyScalar(20));
      expect(toScreen({ x: behind.x, y: behind.z }, view, size, behind.y).x).toBe(Infinity);
    }
  });
  it('moves consistently at different frame rates, boosts with Shift and stays above the ground', () => {
    const flight = { ...overview, fly: true, x: 900, y: 900, elevation: 350, tilt: 90 };
    const run = (frames: number) => {
      let view: Camera = flight;
      for (let i = 0; i < frames; i++) view = stepFlight(view, new Set(['w']), 1 / frames, 90, 'restored', size);
      return view;
    };
    expect(run(30).y).toBeCloseTo(run(60).y);
    expect(run(30).y).toBeCloseTo(810);
    const normal = stepFlight(flight, new Set(['w']), .05, 90, 'restored', size);
    const fast = stepFlight(flight, new Set(['w', 'shift']), .05, 90, 'restored', size);
    expect(flight.y - fast.y).toBeCloseTo((flight.y - normal.y) * 4);
    for (const landscape of ['dry', 'restored'] as const) {
      const corrected = safeFlight({ ...flight, x: 890, y: 555, elevation: -100 }, landscape, size);
      expect(corrected.elevation).toBeGreaterThanOrEqual(elevationAt(corrected.x, corrected.y, landscape) + flightClearance);
      const down = stepFlight(corrected, new Set(['q']), .05, 240, landscape, size);
      expect(down.elevation).toBeGreaterThanOrEqual(elevationAt(down.x, down.y, landscape) + flightClearance);
    }
  });
});
