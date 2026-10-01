import type { PointerEvent } from 'react';

interface Props {
  speed: number;
  onSpeed: (speed: number) => void;
  onHold: (key: string, pressed: boolean) => void;
  onStep: (key: string) => void;
}
const controls = [ ['a', '←', 'Fly left'], ['w', '↑', 'Fly forward'], ['d', '→', 'Fly right'],
  ['q', '↓', 'Descend'], ['s', '↓', 'Fly backward'], ['e', '↑', 'Ascend'] ];
export function FlyoverControls({ speed, onSpeed, onHold, onStep }: Props) {
  const release = (event: PointerEvent<HTMLButtonElement>, key: string) => {
    onHold(key, false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return <div className="flyover-controls">
    <p>Drag to look · WASD to move<br />Q/E down/up · Shift to move faster</p>
    <div className="flyover-pad" role="group" aria-label="Flyover movement">
      {controls.map(([key, label, name]) => <button type="button" key={key} aria-label={name} title={name}
        onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); onHold(key, true); }}
        onPointerUp={event => release(event, key)} onPointerCancel={event => release(event, key)}
        onLostPointerCapture={() => onHold(key, false)} onBlur={() => onHold(key, false)}
        onClick={() => onStep(key)}><span>{label}</span><small>{key.toUpperCase()}</small></button>)}
    </div>
    <label>Speed <output>{speed}</output><input type="range" aria-label="Flyover speed" min="20" max="240" step="10"
      value={speed} onChange={event => onSpeed(Number(event.target.value))} /></label>
  </div>;
}
