import { useCallback, useEffect, useRef, useState } from 'react';
import { bearingDelta, constrain, overview, panBy, zoomAt } from '../lib/camera';
import type { Camera, Point, Size } from '../types';

export function useMapCamera(size: Size) {
  const [camera, setCamera] = useState<Camera>({ ...overview, x: 1000, y: 739, zoom: 1.75 });
  const viewport = useRef(size);
  viewport.current = size;
  const current = useRef(camera);
  const frame = useRef<number | null>(null);
  const cancel = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);
  useEffect(() => cancel, [cancel]);

  const update = useCallback((next: Camera) => {
    current.current = constrain(next, viewport.current);
    setCamera(current.current);
  }, []);

  // A panel resize must not cancel navigation halfway through its zoom. The
  // running tween uses the latest constraints on every frame.
  useEffect(() => { update(current.current); }, [size, update]);

  const move = useCallback((next: Camera, animate = false) => {
    cancel();
    const target = constrain(next, viewport.current);
    if (!animate || !!target.fly !== !!current.current.fly || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      update(target);
      return;
    }
    const start = current.current, started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 520);
      const eased = 1 - (1 - progress) ** 3;
      update({
        ...target,
        bearing: start.bearing + bearingDelta(start.bearing, target.bearing) * eased,
        tilt: start.tilt + (target.tilt - start.tilt) * eased,
        elevation: start.elevation + (target.elevation - start.elevation) * eased,
        x: start.x + (target.x - start.x) * eased,
        y: start.y + (target.y - start.y) * eased,
        zoom: start.zoom + (target.zoom - start.zoom) * eased,
      });
      frame.current = progress < 1 ? requestAnimationFrame(tick) : null;
    };
    frame.current = requestAnimationFrame(tick);
  }, [cancel, update]);

  const zoom = useCallback((factor: number, point: Point = { x: size.width / 2, y: size.height / 2 }, animate = false) => {
    move(zoomAt(current.current, current.current.zoom * factor, point, size), animate);
  }, [move, size]);
  const pan = useCallback((dx: number, dy: number) => {
    move(panBy(current.current, dx, dy, size));
  }, [move, size]);

  return { camera, current, move, zoom, pan, cancel, reset: () => move({ ...overview, bearing: current.current.bearing, tilt: current.current.tilt }, true) };
}
