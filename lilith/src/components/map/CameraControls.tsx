import { useRef, useState } from 'react';
import type { Camera } from '../../types';
import { Icon } from '../Icon';

interface Props {
  camera: Camera;
  scaleReference: boolean;
  onScaleReference: () => void;
  onChange: (camera: Camera) => void;
  onTilt: (tilt: number) => void;
  onOverview: () => void;
  onFlyover: () => void;
}
const directions = ['N', 'E', 'S', 'W'];
const names = ['North', 'East', 'South', 'West'];
export function CameraControls({ camera, onChange, onTilt, onOverview, onFlyover, scaleReference, onScaleReference }: Props) {
  const [open, setOpen] = useState(false);
  const lastTilt = useRef(55);
  const bearing = (camera.bearing % 360 + 360) % 360;
  const direction = directions[Math.round(((360 - bearing) % 360) / 90) % 4];
  const tilted = camera.tilt > .5;
  return <div className="camera-controls" onKeyDown={event => {
    if (event.key === 'Escape' && open) { event.stopPropagation(); setOpen(false); }
  }} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }}>
    {open && !camera.fly && <div className="camera-settings" id="camera-settings">
      <div className="camera-directions" role="group" aria-label="Direction at top of map">
        {directions.map((label, index) => <button type="button" key={label}
          aria-label={`${names[index]} up`} aria-pressed={Math.abs(((360 - bearing) % 360) - index * 90) < 1}
          title={`${names[index]} up`} onClick={() => onChange({ ...camera, bearing: -index * 90 })}>{label}</button>)}
      </div>
      <label className="camera-tilt">Tilt <output>{Math.round(camera.tilt)}°</output>
        <input type="range" aria-label="Map tilt" min="0" max="65" step="1" value={camera.tilt}
          onChange={event => { const tilt = Number(event.target.value); if (tilt > 0) lastTilt.current = tilt; onTilt(tilt); }} />
      </label>
      <button type="button" aria-pressed={scaleReference} onClick={onScaleReference}>1.8 m scale reference</button>
    </div>}
    <div className="camera-bar">
      {!camera.fly && <><button type="button" className="camera-mode" aria-label={tilted ? 'Switch to flat 2D view' : 'Switch to tilted 3D view'}
        aria-pressed={tilted} title={tilted ? 'Flatten the map' : 'Tilt the map'} onClick={() => {
          if (tilted) lastTilt.current = camera.tilt;
          onChange({ ...camera, tilt: tilted ? 0 : lastTilt.current });
        }}>{tilted ? '3D' : '2D'}</button>
      <button type="button" className="camera-compass" aria-label="Compass and tilt controls" aria-expanded={open}
        aria-controls="camera-settings" title="Direction and tilt" onClick={() => setOpen(!open)}>
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" style={{ transform: `rotate(${camera.bearing}deg)` }}>
          <path d="M12 3 16 12 12 10 8 12Z" fill="#805c3a" /><path d="m12 21 4-9-4 2-4-2Z" fill="#8b927f" />
        </svg><span>{direction}</span>
      </button>
      <button type="button" aria-label="Show whole map" title="Show whole map" onClick={onOverview}><Icon name="overview" /></button></>}
      <button type="button" className="camera-flight" aria-label={camera.fly ? 'Return to map view' : 'Enter flyover mode'} title={camera.fly ? 'Return to map' : 'Fly over the terrain'} onClick={() => { setOpen(false); onFlyover(); }}>{camera.fly ? 'Map' : 'Fly'}</button>
    </div>
  </div>;
}
