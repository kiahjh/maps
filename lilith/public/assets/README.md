# Reusable natural assets

## Materials

The live atlas uses a project-authored colour palette and procedural cliff relief, without downloaded textures. The models below also contain their materials and need no image files.

Six local 1k JPEG maps are retained from the earlier material study as unused reference files (colour, OpenGL normal, roughness for each surface):

- [Rock face 03](https://polyhaven.com/a/rock_face_03), photography Dario Barresi, processing Rico Cilliers.
- [Mossy rock](https://polyhaven.com/a/mossy_rock), Rob Tuytel. Source surface covers approximately 3 × 3 metres.

These reference materials are supplied by Poly Haven under [CC0](https://polyhaven.com/license). `materials/provenance.json` records original URLs, creators, byte counts and SHA-256 hashes. The atlas does not load them.

## Models

Project-authored, self-contained glTF 2.0 geometry exported in metres, with Y up:

| Model | Reuse |
| --- | --- |
| `models/river-boulder.gltf` | Fractured loose stone; approximately two metres across before instance scaling |
| `models/rock-slab.gltf` | Flatter fractured stone for future outcrop assemblies |
| `models/grass-clump.gltf` | Curved individual blades, approximately 0.2–0.6 m high |
| `models/flowering-shrub.gltf` | Branches, individual leaves and small flowers |
| `models/wildflower-clump.gltf` | A small patch of stems, leaves and five-petalled flowers, approximately 0.25–0.5 m high |
| `models/broadleaf-tree.gltf` | Tapered branching trunk with individual leaves, approximately 8–11 m high |
| `models/scale-reference-1.8m.gltf` | Neutral human size reference |

Rock materials use a simple weathered stone colour. Plant colours are vertex colours. All seven exports are self-contained, reusable prototypes for the atlas's simplified visual style.

Source: `src/lib/assets/natural-models.ts`. Regenerate exports with `npm run assets`. The live scene instances the same generators with deterministic variations; it does not download a duplicate glTF payload at runtime.
