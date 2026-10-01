import { layout } from '../data/atlas';
import type { Camera, Point, Size } from '../types';

export const overview: Camera = { x: layout.width / 2, y: layout.height / 2, elevation: 0, zoom: 1, bearing: 0, tilt: 30 };
export const flyFov = 55;
export const radians = (degrees: number) => degrees * Math.PI / 180;
export const bearingDelta = (from: number, to: number) => ((to - from + 540) % 360 + 360) % 360 - 180;
export const scaleFor = (camera: Camera, size: Size) => {
  const b = radians(camera.bearing), t = radians(camera.tilt);
  const width = Math.abs(Math.cos(b)) * layout.width + Math.abs(Math.sin(b)) * layout.height;
  const height = Math.cos(t) * (Math.abs(Math.sin(b)) * layout.width + Math.abs(Math.cos(b)) * layout.height);
  return Math.max(.001, Math.min((size.width - 64) / width, (size.height - 64) / height)) * camera.zoom;
};

export function constrain(camera: Camera, _size: Size): Camera {
  return { ...camera,
    zoom: Math.max(1, Math.min(32, camera.zoom)),
    tilt: Math.max(camera.fly ? 12 : 0, Math.min(camera.fly ? 112 : 65, camera.tilt)),
    x: Math.max(camera.fly ? -400 : 0, Math.min(camera.fly ? 2640 : layout.width, camera.x)),
    y: Math.max(camera.fly ? -350 : 0, Math.min(camera.fly ? 1920 : layout.height, camera.y)),
  };
}

// The renderer and HTML markers use the same orthographic orbit basis.
export function toScreen(point: Point, camera: Camera, size: Size, elevation = 0): Point {
  const b = radians(camera.bearing), t = radians(camera.tilt), scale = scaleFor(camera, size);
  const dx = point.x - camera.x, dy = point.y - camera.y;
  if (camera.fly) {
    const dh = elevation - camera.elevation;
    const along = Math.sin(b) * dx + Math.cos(b) * dy;
    const depth = -Math.sin(t) * along - Math.cos(t) * dh;
    if (depth <= .5) return { x: Infinity, y: Infinity };
    const lens = size.height / (2 * Math.tan(radians(flyFov / 2)));
    return {
      x: size.width / 2 + (Math.cos(b) * dx - Math.sin(b) * dy) * lens / depth,
      y: size.height / 2 + (Math.cos(t) * along - Math.sin(t) * dh) * lens / depth,
    };
  }
  return {
    x: size.width / 2 + (Math.cos(b) * dx - Math.sin(b) * dy) * scale,
    y: size.height / 2 + (Math.cos(t) * (Math.sin(b) * dx + Math.cos(b) * dy) - Math.sin(t) * (elevation - camera.elevation)) * scale,
  };
}

export function panBy(camera: Camera, dx: number, dy: number, size: Size): Camera {
  const b = radians(camera.bearing), scale = scaleFor(camera, size);
  const right = dx / scale, down = dy / scale / Math.cos(radians(camera.tilt));
  return constrain({ ...camera,
    x: camera.x - Math.cos(b) * right - Math.sin(b) * down,
    y: camera.y + Math.sin(b) * right - Math.cos(b) * down,
  }, size);
}

export function zoomAt(camera: Camera, zoom: number, point: Point, size: Size): Camera {
  const next = constrain({ ...camera, zoom }, size);
  const ratio = scaleFor(next, size) / scaleFor(camera, size);
  return panBy(next, (point.x - size.width / 2) * (1 - ratio), (point.y - size.height / 2) * (1 - ratio), size);
}

// Avoid the pole singularity of lookAt at exactly top-down by setting up explicitly.
export function orbitPose(camera: Camera, distance = 2800) {
  const b = radians(camera.bearing), t = radians(camera.tilt);
  return {
    position: [camera.x + Math.sin(b) * Math.sin(t) * distance, camera.elevation + Math.cos(t) * distance, camera.y + Math.cos(b) * Math.sin(t) * distance] as const,
    target: [camera.x, camera.elevation, camera.y] as const,
    up: [-Math.sin(b) * Math.cos(t), Math.sin(t), -Math.cos(b) * Math.cos(t)] as const,
  };
}

export function cameraPose(camera: Camera) {
  if (!camera.fly) return orbitPose(camera);
  const b = radians(camera.bearing), t = radians(camera.tilt);
  return {
    position: [camera.x, camera.elevation, camera.y] as const,
    target: [camera.x - Math.sin(b) * Math.sin(t), camera.elevation - Math.cos(t), camera.y - Math.cos(b) * Math.sin(t)] as const,
    up: [-Math.sin(b) * Math.cos(t), Math.sin(t), -Math.cos(b) * Math.cos(t)] as const,
  };
}
