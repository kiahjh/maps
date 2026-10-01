import rawLayout from '../map-layout.json';
import evidence from './map-evidence.json';
import type { Landscape, MapLayout, PlaceEvidence, SourceParagraph } from '../types';

export const layout = rawLayout as MapLayout;
export const places: Record<string, PlaceEvidence> = evidence.places;
export const source: Record<string, SourceParagraph> = evidence.source;
const points = new Map(layout.places.map(place => [place.id, place]));

// Context entries share a map point until they acquire their own detailed scene.
const parentPoints: Record<string, string> = {
  library: 'estate', garret: 'estate', church: 'estate', 'lost-tower': 'estate',
  sexton: 'sleep', 'palace-passages': 'palace', 'black-hall': 'palace',
  'guest-room': 'palace', alabaster: 'palace', 'palace-tree': 'palace',
  'citizen-house': 'bulika', cellars: 'bulika', 'water-trail': 'plain',
};

export const pointFor = (id: string) => points.get(parentPoints[id] ?? id);
export const isVisible = (id: string, landscape: Landscape) => {
  const point = pointFor(id);
  return point && (!point.only || point.only === landscape);
};
export const nameFor = (id: string, landscape: Landscape) => {
  const point = points.get(id);
  return (landscape === 'restored' ? point?.restoredLabel : undefined)
    ?? point?.label ?? places[id]?.title ?? id;
};
