export type Landscape = 'dry' | 'restored';
export type Anchor = 'right' | 'left' | 'top' | 'bottom';

export interface MapPlace {
  id: string;
  x: number;
  y: number;
  label: string;
  restoredLabel?: string;
  priority: number;
  minZoom: number;
  anchor: Anchor;
  only?: Landscape;
  realm?: 'earth';
  focusWidth?: number;
}

export interface MapLayout {
  version: number;
  width: number;
  height: number;
  origin: Point;
  places: MapPlace[];
  related: Record<string, string[]>;
  notes: Record<string, string>;
}

export interface PlaceEvidence {
  id: string;
  title: string;
  state: string;
  paragraphs: string[];
  refs: string[];
}

export interface SourceParagraph {
  id: string;
  chapter: number;
  paragraph: number;
  text: string;
  source_url: string;
}

export interface Point { x: number; y: number }
export interface Size { width: number; height: number }
// In map mode x/y/elevation are the orbit centre; in flyover they are the eye.
export interface Camera extends Point { zoom: number; elevation: number; bearing: number; tilt: number; fly?: boolean }
