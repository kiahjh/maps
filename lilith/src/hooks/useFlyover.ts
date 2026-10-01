import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { enterFlight, safeFlight, stepFlight, travel } from '../lib/flyover';
import type { Camera, Landscape, Size } from '../types';

export function useFlyover(current: RefObject<Camera>, move: (next: Camera, animate?: boolean) => void, size: Size, landscape: Landscape, field: RefObject<HTMLDivElement | null>, active: boolean) {
  const keys = useRef(new Set<string>());
  const saved = useRef<Camera | null>(null);
  const [speed, setSpeed] = useState(30);
  const latest = useRef({ size, landscape, speed }); latest.current = { size, landscape, speed };
  const hold = useCallback((key: string, pressed: boolean) => {
    if (pressed) keys.current.add(key); else keys.current.delete(key);
  }, []);
  const toggle = () => {
    keys.current.clear();
    if (current.current.fly) {
      if (saved.current) move(saved.current);
    } else {
      saved.current = current.current;
      move(enterFlight(current.current, size, landscape));
    }
    field.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    if (active) move(safeFlight(current.current, landscape, size));
  }, [active, landscape, size, current, move]);
  useEffect(() => {
    if (!active) return;
    const down = (event: KeyboardEvent) => {
      if (event.target !== field.current || !['w','a','s','d','q','e','shift'].includes(event.key.toLowerCase())) return;
      event.preventDefault(); keys.current.add(event.key.toLowerCase());
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    const clear = () => keys.current.clear();
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    window.addEventListener('blur', clear); document.addEventListener('visibilitychange', clear);
    let frame = 0, previous = performance.now();
    const tick = (now: number) => {
      const delta = (now - previous) / 1000; previous = now;
      if (!document.hidden && current.current.fly && keys.current.size) {
        const { landscape, size, speed } = latest.current;
        move(stepFlight(current.current, keys.current, delta, speed, landscape, size));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame); clear(); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', clear);
    };
  }, [active, current, move, field]);
  const dolly = useCallback((distance: number) => {
    const { landscape, size } = latest.current;
    move(travel(current.current, distance, 0, 0, landscape, size));
  }, [current, move]);
  return { toggle, hold, speed, setSpeed, dolly };
}
