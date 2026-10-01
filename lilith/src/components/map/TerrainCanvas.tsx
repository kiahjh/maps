import { useEffect, useRef, useState } from 'react';
import { createTerrainWorld } from '../../lib/terrain-world';
import type { Camera, Landscape, Size } from '../../types';

interface Props { camera: Camera; size: Size; landscape: Landscape; scaleReference: boolean }
export function TerrainCanvas(props: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const [error, setError] = useState(false);
  useEffect(() => {
    let world: ReturnType<typeof createTerrainWorld>;
    try { world = createTerrainWorld(canvas.current!, latest.current.landscape); }
    catch (error) { console.error('Terrain renderer could not start', error); setError(true); return; }
    setError(false);
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0, previous = 0;
    const render = (now: number) => {
      frame = requestAnimationFrame(render);
      if (document.hidden || now - previous < 1000 / 30) return;
      const { camera, size, landscape, scaleReference } = latest.current;
      world.render(camera, size, landscape, now / 1000, Math.min(.1, (now - previous) / 1000), preference.matches, scaleReference);
      previous = now;
    };
    frame = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(frame); world.dispose(); };
  }, [createTerrainWorld]);
  return <>
    <canvas ref={canvas} className="terrain-canvas" aria-hidden="true"
      data-camera={`${props.camera.x},${props.camera.y},${props.camera.zoom}`} data-view={props.camera.fly ? 'fly' : 'map'} data-bearing={props.camera.bearing} data-tilt={props.camera.tilt} data-elevation={props.camera.elevation} data-landscape={props.landscape} />
    {error && <p className="terrain-error" role="status">The terrain preview needs WebGL 2. Try a browser with graphics acceleration enabled.</p>}
  </>;
}
