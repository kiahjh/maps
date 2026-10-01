import { useEffect, useRef, useState } from 'react';
import type { PointerEvent, KeyboardEvent } from 'react';
import { pointFor } from '../../data/atlas';
import { useFlyover } from '../../hooks/useFlyover';
import { stepFlight } from '../../lib/flyover';
import { FlyoverControls } from './FlyoverControls';
import { useMapCamera } from '../../hooks/useMapCamera';
import { panBy, zoomAt } from '../../lib/camera';
import type { Camera, Landscape, Point, Size } from '../../types';
import { MapMarkers } from './MapMarkers';
import { TerrainCanvas } from './TerrainCanvas';
import { CameraControls } from './CameraControls';
import { elevationAt } from '../../lib/landscape';

export interface FocusRequest { id: string; sequence: number }
interface Props {
  selected: string | null;
  landscape: Landscape;
  focus: FocusRequest | null;
  onSelect: (id: string) => void;
}
interface Gesture { camera: Camera; center: Point; distance: number }

export function MapViewer({ selected, landscape, focus, onSelect }: Props) {
  const field = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ width: 900, height: 650 });
  const [dragging, setDragging] = useState(false);
  const [scaleReference, setScaleReference] = useState(false);
  const { camera, current, move, zoom, pan, cancel, reset } = useMapCamera(size);
  const flight = useFlyover(current, move, size, landscape, field, !!camera.fly);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<Gesture | null>(null);
  const lastFocus = useRef<FocusRequest | null>(null);

  useEffect(() => {
    const element = field.current!;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width && height) setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Consume a navigation once; resizing or hot updates must not undo panning.
    if (!focus || focus === lastFocus.current) return;
    // Let the conditional detail panel settle the viewport before focusing.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        lastFocus.current = focus;
        if (focus.id === 'overview') { reset(); return; }
        const point = pointFor(focus.id);
        if (point) move({ ...current.current, fly: false, x: point.x, y: point.y, elevation: elevationAt(point.x, point.y, landscape), zoom: point.id === 'cataract' ? 11 : Math.max(3.4, point.minZoom + .6) }, true);
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [focus, move, landscape]);

  useEffect(() => {
    const element = field.current!;
    const wheel = (event: WheelEvent) => {
      if ((event.target as Element).closest('.camera-controls')) return;
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? size.height : 1;
      if (current.current.fly) { flight.dolly(Math.max(-60, Math.min(60, -event.deltaY * unit * .16))); return; }
      if (event.ctrlKey || event.metaKey) zoom(Math.exp(-event.deltaY * unit * .01), { x: event.clientX - rect.left, y: event.clientY - rect.top });
      else pan(-event.deltaX * unit, -event.deltaY * unit);
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [pan, zoom, size.height, flight.dolly]);

  const rebaseGesture = () => {
    const points = [...pointers.current.values()];
    if (!points.length) { gesture.current = null; return; }
    const [a, b] = points;
    gesture.current = {
      camera: current.current,
      center: b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : a,
      distance: b ? Math.hypot(a.x - b.x, a.y - b.y) : 0,
    };
  };
  const localPoint = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest('button, input, .camera-controls, .flyover-controls') || (event.pointerType === 'mouse' && event.button !== 0)) return;
    cancel();
    event.currentTarget.focus({ preventScroll: true });
    pointers.current.set(event.pointerId, localPoint(event));
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    rebaseGesture();
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return;
    pointers.current.set(event.pointerId, localPoint(event));
    const [a, b] = [...pointers.current.values()], initial = gesture.current;
    const center = b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : a;
    if (initial.camera.fly) {
      move({ ...initial.camera,
        bearing: initial.camera.bearing - (center.x - initial.center.x) * .22,
        tilt: initial.camera.tilt - (center.y - initial.center.y) * .18,
      });
      return;
    }
    const distance = b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    const next = initial.distance > 0 ? zoomAt(initial.camera, initial.camera.zoom * distance / initial.distance, initial.center, size) : initial.camera;
    move(panBy(next, center.x - initial.center.x, center.y - initial.center.y, size));
  };
  const pointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    setDragging(pointers.current.size > 0);
    rebaseGesture();
  };
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (current.current.fly) {
      if (event.key === 'Escape') { event.stopPropagation(); flight.toggle(); return; }
      const turns: Record<string, [number, number]> = { ArrowLeft: [5, 0], ArrowRight: [-5, 0], ArrowUp: [0, 5], ArrowDown: [0, -5] };
      if (turns[event.key]) { event.preventDefault(); const [bearing, tilt] = turns[event.key]; move({ ...current.current, bearing: current.current.bearing + bearing, tilt: current.current.tilt + tilt }); }
      return;
    }
    const actions: Record<string, () => void> = {
      '+': () => zoom(1.5), '=': () => zoom(1.5), '-': () => zoom(1 / 1.5),
      ArrowLeft: () => pan(70, 0), ArrowRight: () => pan(-70, 0),
      ArrowUp: () => pan(0, 70), ArrowDown: () => pan(0, -70), Home: reset,
      '[': () => move({ ...current.current, bearing: current.current.bearing - 90 }, true),
      ']': () => move({ ...current.current, bearing: current.current.bearing + 90 }, true),
    };
    if (actions[event.key]) { event.preventDefault(); actions[event.key](); }
  };

  return <section className="map-section" aria-label="Interactive atlas">
    <div ref={field} className="map-field" data-dragging={dragging} tabIndex={0} role="region"
      aria-label={camera.fly ? 'Flyover of the strange country. Drag to look; WASD to move; Q and E to descend and ascend; Shift for faster movement; Escape to return to the map.' : 'Map of the strange country. Drag or use arrow keys to pan; plus and minus to zoom; brackets to rotate; Home for overview.'}
      onKeyDown={keyDown} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd}
      onPointerCancel={pointerEnd} onLostPointerCapture={pointerEnd}
      onDoubleClick={event => {
        if (current.current.fly) return;
        if ((event.target as Element).closest('button, input, .camera-controls, .flyover-controls')) return;
        const rect = event.currentTarget.getBoundingClientRect();
        zoom(1.7, { x: event.clientX - rect.left, y: event.clientY - rect.top }, true);
      }}>
      <TerrainCanvas camera={camera} size={size} landscape={landscape} scaleReference={scaleReference} />
      <MapMarkers camera={camera} size={size} landscape={landscape} selected={selected} onSelect={onSelect} />
      <CameraControls scaleReference={scaleReference} onScaleReference={() => setScaleReference(value => !value)} camera={camera} onChange={next => move(next, true)} onTilt={tilt => move({ ...current.current, tilt })} onOverview={reset} onFlyover={flight.toggle} />
      {camera.fly && <FlyoverControls speed={flight.speed} onSpeed={flight.setSpeed} onHold={flight.hold}
        onStep={key => move(stepFlight(current.current, new Set([key]), .05, flight.speed, landscape, size))} />}
    </div>
  </section>;
}
