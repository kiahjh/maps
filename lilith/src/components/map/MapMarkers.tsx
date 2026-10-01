import { useLayoutEffect, useRef, useState } from 'react';
import { layout, nameFor, pointFor } from '../../data/atlas';
import { scaleFor, toScreen } from '../../lib/camera';
import type { Anchor, Camera, Landscape, Point, Size } from '../../types';
import { elevationAt } from '../../lib/landscape';

interface Props {
  camera: Camera;
  size: Size;
  landscape: Landscape;
  selected: string | null;
  onSelect: (id: string) => void;
}
interface Rect extends Point { width: number; height: number }
function intersects(a: Rect, b: Rect) {
  return a.x < b.x + b.width + 5 && a.x + a.width + 5 > b.x
    && a.y < b.y + b.height + 4 && a.y + a.height + 4 > b.y;
}
function labelRect(point: Point, size: Size, anchor: Anchor): Rect {
  const { width, height } = size;
  const positions: Record<Anchor, Point> = {
    right: { x: point.x + 12, y: point.y - height / 2 },
    left: { x: point.x - width - 12, y: point.y - height / 2 },
    top: { x: point.x - width / 2, y: point.y - height - 12 },
    bottom: { x: point.x - width / 2, y: point.y + 12 },
  };
  return { ...positions[anchor], width, height };
}

export function MapMarkers({ camera, size, landscape, selected, onSelect }: Props) {
  const elements = useRef(new Map<string, HTMLButtonElement>());
  const [measurements, setMeasurements] = useState<Record<string, Size>>({});
  useLayoutEffect(() => {
    const next: Record<string, Size> = {};
    elements.current.forEach((el, id) => { next[id] = { width: el.offsetWidth, height: el.offsetHeight }; });
    setMeasurements(next);
  }, [landscape]);

  const selectedPoint = selected ? pointFor(selected)?.id : undefined;
  const occupied: Rect[] = [
    { x: 16, y: 16, width: 130, height: 42 },
    { x: size.width - 204, y: size.height - 186, width: 192, height: 174 },
    ...(camera.fly ? [{ x: 12, y: size.height - 220, width: 208, height: 210 }] : []),
  ];
  const labels = new Map<string, Rect>();
  const sorted = [...layout.places].sort((a, b) =>
    (a.id === selectedPoint ? -1 : a.priority) - (b.id === selectedPoint ? -1 : b.priority));
  for (const place of sorted) {
    if (place.only && place.only !== landscape) continue;
    if (camera.zoom < place.minZoom && place.id !== selectedPoint) continue;
    const point = toScreen(place, camera, size, elevationAt(place.x, place.y, landscape));
    const measured = measurements[place.id] ?? { width: nameFor(place.id, landscape).length * 7 + 18, height: 28 };
    const anchors = [...new Set<Anchor>([place.anchor, 'right', 'left', 'top', 'bottom'])];
    for (const anchor of anchors) {
      const rect = labelRect(point, measured, anchor);
      if (rect.x >= 8 && rect.y >= 8 && rect.x + rect.width <= size.width - 8
        && rect.y + rect.height <= size.height - 8 && !occupied.some(other => intersects(rect, other))) {
        labels.set(place.id, rect);
        occupied.push(rect);
        break;
      }
    }
  }

  return <div className="map-markers">
    {layout.places.map(place => {
      const point = toScreen(place, camera, size, elevationAt(place.x, place.y, landscape));
      const visible = (!place.only || place.only === landscape) && point.x >= 10 && point.x <= size.width - 10 && point.y >= 10 && point.y <= size.height - 10;
      const label = labels.get(place.id), name = nameFor(place.id, landscape);
      const active = place.id === selectedPoint;
      return <div key={place.id}>
        {visible && <button type="button" className={`map-pin${active ? ' is-selected' : ''}`}
          style={{ left: point.x, top: point.y }} aria-label={`Explore ${name}`} aria-pressed={active}
          onClick={() => onSelect(place.id)}><span /></button>}
        <button type="button" ref={el => { if (el) elements.current.set(place.id, el); else elements.current.delete(place.id); }}
          className={`map-label${active ? ' is-selected' : ''}`} tabIndex={-1} aria-hidden="true"
          style={{ left: label?.x ?? 0, top: label?.y ?? 0, visibility: label && visible ? 'visible' : 'hidden' }}
          onClick={() => onSelect(place.id)}>{name}</button>
      </div>;
    })}
    {(() => {
      const point = toScreen({ x: 105, y: 191 }, camera, size, elevationAt(105, 191, landscape));
      return 410 * scaleFor(camera, size) >= 112 && point.x > 12 && point.y > 12 && point.x < size.width - 115 && point.y < size.height - 20
        ? <span className="earth-label" style={{ left: point.x, top: point.y }}>The earthly world</span> : null;
    })()}
  </div>;
}
