import { cameraPose, constrain, flyFov, orbitPose, radians, scaleFor } from './camera';
import { elevationAt } from './landscape';
import type { Camera, Landscape, Size } from '../types';

export const flightClearance = 2.5;
export function safeFlight(camera: Camera, landscape: Landscape, size: Size): Camera {
  const bounded = constrain(camera, size);
  return { ...bounded, elevation: Math.min(5000, Math.max(bounded.elevation, elevationAt(bounded.x, bounded.y, landscape) + flightClearance)) };
}
export function enterFlight(camera: Camera, size: Size, landscape: Landscape): Camera {
  const lens = size.height / (2 * Math.tan(radians(flyFov / 2)));
  const pose = orbitPose({ ...camera, tilt: Math.max(12, camera.tilt) }, lens / scaleFor(camera, size));
  return safeFlight({ ...camera, fly: true, x: pose.position[0], elevation: pose.position[1], y: pose.position[2] }, landscape, size);
}
export function travel(camera: Camera, forward: number, right: number, vertical: number, landscape: Landscape, size: Size): Camera {
  const pose = cameraPose(camera), b = radians(camera.bearing);
  return safeFlight({ ...camera,
    x: camera.x + forward * (pose.target[0] - pose.position[0]) + right * Math.cos(b),
    elevation: camera.elevation + forward * (pose.target[1] - pose.position[1]) + vertical,
    y: camera.y + forward * (pose.target[2] - pose.position[2]) - right * Math.sin(b),
  }, landscape, size);
}
export function stepFlight(camera: Camera, keys: Set<string>, delta: number, speed: number, landscape: Landscape, size: Size): Camera {
  const forward = Number(keys.has('w')) - Number(keys.has('s'));
  const right = Number(keys.has('d')) - Number(keys.has('a'));
  const vertical = Number(keys.has('e')) - Number(keys.has('q'));
  const length = Math.max(1, Math.hypot(forward, right, vertical));
  const amount = Math.min(.05, delta) * speed * (keys.has('shift') ? 4 : 1) / length;
  return travel(camera, forward * amount, right * amount, vertical * amount, landscape, size);
}
