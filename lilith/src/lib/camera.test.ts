import { describe, expect, it } from 'vitest';
import { bearingDelta, constrain, orbitPose, overview, panBy, scaleFor, toScreen, zoomAt } from './camera';
import { OrthographicCamera, Vector3 } from 'three';
import { elevationAt } from './landscape';
import { layout, places, pointFor, source } from '../data/atlas';

describe('map camera', () => {
  const size = { width: 1000, height: 700 };
  it('keeps the world point under a zoom gesture stationary', () => {
    const camera = { ...overview, x: 1100, y: 750, zoom: 3 };
    const world = { x: 1250, y: 850 };
    const screen = toScreen(world, camera, size);
    const next = zoomAt(camera, 5, screen, size);
    expect(toScreen(world, next, size).x).toBeCloseTo(screen.x);
    expect(toScreen(world, next, size).y).toBeCloseTo(screen.y);
  });
  it('fits the complete map at overview on desktop and phone', () => {
    for (const viewport of [size, { width: 340, height: 390 }]) {
      const topLeft = toScreen({ x: 0, y: 0 }, overview, viewport);
      const bottomRight = toScreen({ x: layout.width, y: layout.height }, overview, viewport);
      expect(topLeft.x).toBeGreaterThanOrEqual(31.99);
      expect(topLeft.y).toBeGreaterThanOrEqual(31.99);
      expect(bottomRight.x).toBeLessThanOrEqual(viewport.width - 31.99);
      expect(bottomRight.y).toBeLessThanOrEqual(viewport.height - 31.99);
    }
  });
  it('limits zoom, tilt and panning to the country', () => {
    const next = constrain({ ...overview, x: -1e6, y: 1e6, zoom: 100, tilt: 90 }, size);
    expect(next.zoom).toBe(32);
    expect(next.tilt).toBe(65);
    expect(next.x).toBe(0);
    expect(next.y).toBe(layout.height);
  });
  it('aligns elevated markers with Three.js for every direction and tilt', () => {
    for (const bearing of [0, 90, 180, 270, 359]) for (const tilt of [0, 30, 65]) for (const state of ['dry', 'restored'] as const) {
      const view = { ...overview, bearing, tilt, x: 890, y: 580, elevation: elevationAt(890, 580, state), zoom: 5 };
      const scale = scaleFor(view, size), pose = orbitPose(view);
      const rendererCamera = new OrthographicCamera(-size.width / scale / 2, size.width / scale / 2, size.height / scale / 2, -size.height / scale / 2, 1, 6500);
      rendererCamera.position.set(...pose.position); rendererCamera.up.set(...pose.up); rendererCamera.lookAt(...pose.target); rendererCamera.updateMatrixWorld();
      for (const point of [{ x: 890, y: 580 }, { x: 820, y: 1110 }, { x: 840, y: 790 }]) {
        const elevation = elevationAt(point.x, point.y, state);
        const actual = new Vector3(point.x, elevation, point.y).project(rendererCamera);
        const screen = toScreen(point, view, size, elevation);
        expect(screen.x).toBeCloseTo((actual.x + 1) * size.width / 2);
        expect(screen.y).toBeCloseTo((1 - actual.y) * size.height / 2);
      }
    }
  });
  it('puts the requested compass direction at the top', () => {
    for (const [bearing, point] of [[0, { x: 1120, y: 650 }], [-90, { x: 1220, y: 750 }], [-180, { x: 1120, y: 850 }], [-270, { x: 1020, y: 750 }]] as const) {
      const projected = toScreen(point, { ...overview, bearing }, size);
      expect(projected.x).toBeCloseTo(size.width / 2);
      expect(projected.y).toBeLessThan(size.height / 2);
    }
  });
  it('pans in screen directions and anchors zoom after rotation and tilt', () => {
    for (const bearing of [0, 90, 180, 270]) for (const tilt of [0, 65]) {
      const view = { ...overview, bearing, tilt, zoom: 3 };
      const point = { x: 1200, y: 850 }, screen = toScreen(point, view, size, 70);
      const panned = panBy(view, 45, -30, size);
      expect(toScreen(point, panned, size, 70).x).toBeCloseTo(screen.x + 45);
      expect(toScreen(point, panned, size, 70).y).toBeCloseTo(screen.y - 30);
      const next = zoomAt(view, 6, screen, size);
      // An elevated point needs a centre-height correction to remain anchored.
      const groundScreen = toScreen(point, view, size);
      const groundNext = zoomAt(view, 6, groundScreen, size);
      expect(toScreen(point, groundNext, size).x).toBeCloseTo(groundScreen.x);
      expect(toScreen(point, groundNext, size).y).toBeCloseTo(groundScreen.y);
      expect(next.bearing).toBe(bearing);
      expect(next.tilt).toBe(tilt);
    }
    expect(bearingDelta(270, 0)).toBe(90);
    expect(bearingDelta(0, 270)).toBe(-90);
  });
});

describe('atlas evidence integrity', () => {
  it('resolves every navigable entry to a map point and original passages', () => {
    for (const place of Object.values(places)) {
      expect(pointFor(place.id), place.id).toBeDefined();
      for (const ref of place.refs) expect(source[ref]?.text, ref).toBeTruthy();
    }
    for (const [id, related] of Object.entries(layout.related)) {
      expect(places[id], id).toBeDefined();
      for (const child of related) expect(places[child], child).toBeDefined();
    }
  });
  it('keeps nested palace rooms at the palace and the final city separate', () => {
    expect(pointFor('alabaster')?.id).toBe('palace');
    expect(pointFor('mountain-city')?.id).not.toBe(pointFor('bulika')?.id);
    expect(pointFor('mountain-city')?.only).toBe('restored');
  });
});
