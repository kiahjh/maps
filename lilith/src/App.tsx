import { useEffect, useState } from 'react';
import { isVisible, pointFor } from './data/atlas';
import type { Landscape } from './types';
import { MapViewer } from './components/map/MapViewer';
import type { FocusRequest } from './components/map/MapViewer';
import { PlaceDetails } from './components/PlaceDetails';

export function App() {
  const [landscape, setLandscape] = useState<Landscape>('dry');
  const [selected, setSelected] = useState<string | null>(null);
  const [focus, setFocus] = useState<FocusRequest | null>(null);
  const select = (id: string) => {
    const point = pointFor(id);
    if (point?.only) setLandscape(point.only);
    setSelected(id);
    setFocus(previous => ({ id, sequence: (previous?.sequence ?? 0) + 1 }));
  };
  const changeLandscape = (next: Landscape) => {
    setLandscape(next);
    if (selected && !isVisible(selected, next)) {
      setSelected(null);
      setFocus(previous => ({ id: 'overview', sequence: (previous?.sequence ?? 0) + 1 }));
    }
  };

  const dismiss = () => { setSelected(null); setFocus(null); };
  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setSelected(null); setFocus(null); }
    };
    window.addEventListener('keydown', keyDown);
    return () => window.removeEventListener('keydown', keyDown);
  }, []);

  return <main className={`atlas-app${selected ? ' has-selection' : ''}`}>
    <div className="atlas-map">
      <MapViewer selected={selected} landscape={landscape} focus={focus} onSelect={select} />
        <div className="landscape-switch" role="group" aria-label="Landscape">
          <button type="button" aria-pressed={landscape === 'dry'} onClick={() => changeLandscape('dry')}>Dry</button>
          <button type="button" aria-pressed={landscape === 'restored'} onClick={() => changeLandscape('restored')}>Water</button>
        </div>
    </div>
    {selected && <aside className="atlas-sidebar">
      <PlaceDetails key={selected} selected={selected} landscape={landscape} onSelect={select} onClose={dismiss} />
    </aside>}
  </main>;
}
