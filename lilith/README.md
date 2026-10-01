# Lilith atlas

A React + TypeScript app for exploring George MacDonald’s *Lilith*. A continuous terrain prototype replaces the SVG schematic and separate illustrated location view. The first developed corridor runs from the upper desert over the cataract, down both river branches and around Evil Wood. Clicking a place moves the camera through the same terrain. The map fills the viewport, with a Dry/Water toggle, compact camera controls and a dismissible selected-place panel.

## Run locally

Use Node.js 22.12+ and Python 3 (for preparing the preserved research data).

```sh
cd /Users/miciah/active-projects/maps/lilith
npm install
npm run dev
```

Open **http://127.0.0.1:5173/**. Vite updates the app as source files change. The server listens only on the local machine. This is the working app; the root `index.html` is now its entry point and needs a server.

```sh
npm run build   # validate data, type-check, and produce dist/
npm test        # camera, terrain topology, projection and evidence integrity
npm run preview
```

`dist/` is a static deployable app, including the independent research reader. It requires static hosting, with no backend or accounts. All fonts and artwork are local; the app itself makes no requests to third-party services.

## Structure

- `src/App.tsx`: selected place, landscape state, and overall page layout.
- `src/components/map/MapViewer.tsx`: map viewport, gestures, keyboard controls, and focus requests.
- `src/components/map/TerrainCanvas.tsx`: renderer lifecycle, responsive canvas, reduced motion and frame scheduling.
- `src/lib/landscape.ts`: deterministic height field, erosion, woodland masks.
- `src/lib/flyover.ts`, `src/hooks/useFlyover.ts`: perspective flight, movement, terrain clearance and input lifecycle.
- `src/lib/terrain-surface.ts`: continuous world-space rock and soil shading.
- `src/lib/terrain-world.ts`: Three.js terrain mesh, procedural surface materials, instanced trees and rocks, waterways and sunlight.
- `public/artwork/cataract/`: the earlier generated paintings and prompt provenance, retained as visual studies. The app no longer displays these as separate scenes.
- `src/hooks/useMapCamera.ts`: cancellable camera animation; respects reduced motion.
- `src/lib/camera.ts`: shared orbit projection, compass orientation, tilt, anchored zoom and pan constraints.
- `src/data/terrain.ts`: original editorial river paths used to shape the terrain; also retains the earlier draft's outlines.
- `src/components/map/MapMarkers.tsx`: place markers, zoom-dependent labels, and collision avoidance.
- `src/components/PlaceDetails.tsx`: selected-place context, connected places, and original passages.
- `src/styles.css`, `src/components/map/map.css`: page and map styling.
- `src/map-layout.json`: coordinates, label priorities, relationships, and uncertainty notes.
- `src/data/atlas.ts`: typed evidence access and parent markers for interiors.
- `research/`: canonical evidence JSON, full context reader, text dossier, passage catalogue, and indexed book text.
- `sources/`: preserved Gutenberg HTML, normalized text, all 47 chapter files, annotations, and omission audit.

## Map and research changes

Edit `src/map-layout.json` to reposition places, adjust label priority, or change connections. Edit `src/data/terrain.ts` for river paths, `src/lib/landscape.ts` for terrain and biome rules, and `src/lib/terrain-world.ts` for rendering and materials. The map camera orbits a centre in native terrain coordinates, with an elevation, bearing and tilt. In flyover mode those coordinates locate the camera eye. The renderer and HTML markers share the same orthographic or perspective camera basis in `src/lib/camera.ts`, keeping labels attached to the terrain at every angle. Selecting a place centres the orbit on its ground elevation and preserves the current direction and tilt.

The terrain uses one deterministic height field. Both branches share the upstream endpoint at the cataract. The same paths carve the riverbeds and construct the water surfaces. The dry upper course receives sand fill; the lower channels retain their carved rock beds. The hot stream stays wet in both states. Restoration changes ground color, reveals water and adds vegetation within the existing world. No image swap or scene navigation occurs on selection.

`npm run dev` and `npm run build` both run `scripts/prepare-map-data.py`. It validates references, generates the map’s small evidence subset at `src/data/map-evidence.json`, and copies the independent dossier into `public/research/`. These generated files are ignored. During a running dev session, run `npm run data` after research changes to refresh them; source layout edits update directly.

The research itself can be regenerated from preserved source and annotations:

```sh
python3 scripts/research/prepare_source.py
python3 scripts/research/build_reader.py
npm run data
```

## Navigation

Click a marker, label, or connected place to zoom to it and open its evidence panel. Close the panel with its close button or Escape. Interior entries share their parent marker until they receive a dedicated scene. The Dry/Water toggle switches landscapes; restored-only places appear in Water mode.

The app initially frames the cataract-to-Evil-Wood corridor. Selecting the cataract zooms closer to its rock face and the dividing falls. Connected-place buttons move along the same terrain. Closing the panel preserves the camera position. The toggle preserves the view while water and ground materials transition. Reduced motion disables camera animation and flowing-water motion, and applies landscape changes immediately.

Drag or scroll to pan. Pinch, Ctrl/Command-scroll, or double-click to zoom. Focus the map and use arrow keys to pan, `+`/`-` to zoom, and Home for the overview. Use the bottom-right 3D/2D button to flatten or tilt the map. Open the compass for North/East/South/West-up views and a continuous 0–65° tilt slider. The adjacent overview button fits the whole country while keeping your orientation. The `[`/`]` keys rotate by 90° when the map has focus. Zoom reaches 32× for closer inspection. Camera changes respect reduced motion. The Fly button switches to perspective inspection. Drag to look, hold WASD to move, Q/E to descend/ascend, and Shift for 4× speed. Arrow keys adjust the viewing angle; scrolling moves forward/backward. The on-screen pad supports clicking and holding, and a speed slider controls movement. Movement maintains clearance over the active terrain. Map or Escape returns to the saved map view; selecting another place returns to map navigation. Flight keys release when the window loses focus or the tab becomes hidden. View state currently resets when the page reloads.

## Accuracy

The next geography pass is specified in [Rebuilding the geography of Lilith](docs/world-geography-study.md), with source-linked constraints and invented candidate route lengths in `research/world-scale-plan.json`. All schematic positions are revisable. Fit the connected journeys at physical scale before extending finished scenery; the proposal is not yet applied to the live map.

This is a terrain and interaction prototype, with provisional distances, elevations, river widths and compass orientation. The cataract corridor has received the first terrain treatment; outlying settlements, lake basins and cross-world portals still need individual development. Preserve the explicit relationships: Evil Wood between the river branches, the cataract above the fork, the valley’s forest connection to the hot stream, and the plain toward Bulika. Keep the hot stream distinct from the great river; keep the final mountain city distinct from Bulika. Distinguish witnessed restoration from Vane’s predictions and dream-only travel. The earthly world is a separate setting, and its draft marker does not establish a geographic connection to the strange country.

Chapters XVI and XLV establish the rocky fall, the fork, hidden water and sand in the dry state, and the full upstream river, grass and new woods after restoration. The height field and vegetation are artistic interpretations of these relationships. The earlier paintings are reference studies, not measured map tiles.

The first close-detail pass is bounded around the cataract. A feathered landform treatment introduces unequal shelves, recesses and a rubble apron; the single terrain mesh has denser vertices there, with no separate scene or patch seam. World-space procedural stone layering and light-reactive surface relief replace flat colour in this area. Smaller rounded debris replaces the large faceted cliff stones, moss marks the channel margins at the foot, and the falls have less uniform foam. The wider layout, vegetation models and regional distances remain provisional and await the next reviewed step.

The renderer requires WebGL 2. It caps display resolution at 2× and rendering at 30 frames per second, pauses drawing in hidden tabs, shares instanced vegetation and rock geometry, and disposes GPU resources on unmount. The river's influence bounds are indexed to keep initial terrain generation responsive. Materials and finer vegetation are the next visual development areas; this is not final artwork.

Paragraph IDs such as `16.004` are research locators for this edition, not printed page numbers. `research/lilith-geography-evidence.json` remains the canonical evidence record.

## Original standalone map

The pre-React map is preserved at `legacy/index.html`, which opens directly without a server. Its template is `legacy/map-template.html`, and its bundled export runtime remains in `vendor/visualize/`. To rebuild only that archive:

```sh
python3 scripts/build.py
```

This command writes `legacy/index.html` and `build/map-fragment.html`; it does not replace the React entry point.

## Sources and provenance

- Novel: https://www.gutenberg.org/files/1640/1640-h/1640-h.htm
- Secondary cross-check: Kaitlyn Dryer, “Mapping the Text of Lilith: MacDonald’s Labyrinths and Gardens,” *North Wind* 31 (2012), pp. 65–94: https://digitalcommons.snc.edu/northwind/vol31/iss1/6/
- Dale J. Nelson’s study guide: https://www.sffchronicles.com/threads/534726/
- Greville MacDonald’s first-draft paraphrase, with notes by John Docherty: https://www.george-macdonald.com/resources/spiritual_structure_lilith.html

`sources/secondary/references.json` records these references, their relevance to future scene design, and edition differences. Interpretive and early-manuscript details remain separate from the published novel’s geography.

Copied on September 30, 2026 from the local chat workspace at `/Users/miciah/Documents/Codex/2026-09-30/ok-x20`. Original chat files remain there. This directory is the working project for subsequent changes.
