# Rebuilding the geography of Lilith

Research and design proposal, 1 October 2026. This does not change the live landscape.

## Governing decision

Every regional position, outline and distance in `src/map-layout.json` is open to replacement. The existing schematic is an itinerary illustration, not a survey. Enlarging it uniformly would preserve its errors and enlarge buildings, vegetation and local scenes along with the country.

Build a new physical landscape from the novel's relationships, journeys and descriptions. Use metres for geometry and human-sized objects. Choose regional distances where MacDonald supplies none, record those choices as interpretations, and revise them when another passage conflicts. Preserve the accepted cataract's visual language: project-authored geometry, procedural cliff materials and simple, beautiful vegetation. Its position and dimensions remain revisable.

## Research basis and limits

The existing [evidence dossier](../research/lilith-geography-evidence.json) covers all 47 chapters, 243 annotated evidence groups, 47 gazetteer entries and 44 route relationships. This pass reviewed that synthesis and its routes, then checked primary passages for the outward journey, return to Mara and the House of Sleep, hand-burial mission, and restored upstream journey. It is a new geography audit of the earlier full-book study, not a claim to have freshly reread every word.

Paragraph IDs below identify the saved Gutenberg edition. They are local research locators, not printed page numbers. The [original novel](https://www.gutenberg.org/files/1640/1640-h/1640-h.htm) remains the authority. Secondary commentary can suggest questions but cannot supply measurements missing from the text.

## Relationships to preserve

| Region or feature | What the book establishes | What we must still choose |
| --- | --- | --- |
| Cemetery moor and House of Sleep | Cold, rocky heath with low plants and moss; the apparent cemetery extends to the horizon. Its walk connects to the monster basin and low ridge. `06.001–008`, `10.005–11.003`, `40.044–060` | Moor outline, cottage dimensions, exact paths and ridge elevations. Treat the extraordinary interior as more than a normal house floor plan. |
| First river branch | A wide rocky bed with innumerable channels, humps and pinnacles. Vane takes the whole day from the ridge to reach Evil Wood. `11.001–005` | Width and course of the channel belt. The full day's journey includes the approach; it is not a measured bank-to-bank crossing. |
| Evil Wood and second branch | Evil Wood lies between the two branches and is visible on the far horizon from the cataract. After leaving the wood in mid-afternoon, Vane encounters a second network of channels, sleeps there and continues in the morning. `11.015–017`, `12.001–003`, `16.004` | Woodland extent, channel convergence and distances. These should become substantial regions, not an isolated circular grove between two narrow strips. |
| Fruit valley | Dwarf fruit trees increasingly fill the second branch's channels; larger fruit trees stand at the rim of a former lake basin. Forest enters the hollow from Vane's left. `12.001–004` | Basin shape, lake level and shoreline. Its refilling is predicted in `42.001`; the final journey does not survey that lake or Evil Wood's complete island perimeter. |
| Mara's cottage | After leaving the channels, Vane walks a long way over sand. The cottage stands on rock in deep sand. The later return approaches Mara through the country between the branches; she guides an easy crossing toward the monster basin. `15.035`, `15.050`, `38.015–016`, `40.027–044`, `42.002` | Exact interbranch position and route to the bank. A nearby riverbank cottage is not required. |
| Cataract | Many desert miles beyond Mara; rugged, abrupt rock, moss at its foot, and a worn face Vane climbs. The restored river swirls and drops sheer, splitting into two branches. `16.001–004`, `41.038`, `45.010` | Drop, width, geology and precise climb. Current 38 m drop / 40 m upper width are artistic choices. Recheck their fit with the larger branch system before fixing them. |
| Upper country | In the dry journey the river's course has disappeared beneath fine sand. After restoration a deep, broad, quiet river crosses grassy plains, forests and flowering undergrowth. The hand-burial site leaves no sign; the river comes from much farther upstream. `16.004`, `41.017–038`, `45.010–013` | Length, landforms and tributary arrangement. Do not turn the burial point into the river's source or fill the dry upper desert with the restored forest. |
| Great forest and nests | The baby-finding forest extends from the fruit valley to the hot stream. The children move from bushes to a region of large trees with little undergrowth and build nests, including one high in an enormous walnut. Stone is not plentiful. They can still forage in the orchard. `32.013`, `32.027–035`, `33.001–004`, `33.021` | Continuous forest boundary and internal habitats. Nest trees need convincing size; don't distribute cataract rock scatter or thick shrubbery throughout this woodland. |
| Guide forest, ivy hall and carriage | Tamarisk/juniper and stunted firs precede larger forest trees. Roomy, almost regular trunks and sparse undergrowth lead to rose trees and a hall made of growing vegetation. Vane catches sight of the carriage before walking ten paces from the hall. `16.006–014`, `17.001`, `38.008–013` | Hall dimensions, local plant forms and nearby carriage position. The ten paces measure the walk before sighting it, not the full distance to the carriage. No masonry hall or established carriage road is described. |
| Hot stream | A deep, brim-full stream only a few yards wide, with hot water, metallic taste and rising bluish mist, runs along the forest edge beside the plain. Nearby upstream hills contain a small cave where it rises quietly from the ground. `18.017`, `18.022`, `18.025–027` | Exact width within that description, hills and spring geometry. It is a separate water system; no connection to the great river is established. The imagined internal waterfall is explicitly corrected by the cave visit. |
| Plain and Bulika | Beyond the stream lies grass to the horizon. Vane follows Lilith all day and continues through the night before seeing Bulika at dawn. The expedition also divides its march into travel and rest stages. The return includes camping before crossing the stream. `20.018–025`, `21.001–039`, `22.001–004`, `35.001–007`, `38.001–008` | A substantial plain, approach distances, city diameter and street plan. Preserve vegetable gardens and a gravel/refuse belt outside the walls. Bulika must not sit beside the stream as a miniature town. |
| Final mountain city | Beyond greater forests and a far plain stands a solitary mountain and a city explicitly unlike Bulika. The river descends from its peak through the main street and a broad stair; smaller stairs rise along its banks. `45.012–013`, `46.001–004`, `46.023–035` | Upstream distances, mountain height, architecture and clouds. Do not reuse Bulika or identify every earlier distant hill with this mountain. |

The earthly estate belongs to a separate setting, connected through transitions. Neither the early pine crossing nor dream-only terrain has a proven ordinary connection to every later forest or mountain. Keep these distinctions in the layout. `02.010–011`, `04.001–008`, `43.001–44.001`, `46.035`, `47.002`

## Why the current placement must change

These are straight distances between current marker coordinates, calculated from the file. They are not walking distances or estimates from the novel. Applying the local metre convention exposes the compression:

| Current pair | Current separation | Consequence for the rebuild |
| --- | ---: | --- |
| Mara → cataract | 216 m | Replace with a desert journey of many miles. |
| Cataract → Evil Wood | 535 m | Move the wood into genuinely distant interbranch country and preserve the view back toward it. |
| Fruit valley → hot stream | 598 m | Make room for a continuous regional forest with different habitats and journey stages. |
| Nest village → ivy hall | 328 m | Expand: after crossing the stream the returning party sleeps at the hall, with the nests still far away. |
| Nest village → Mara | 680 m | Replace with a journey that includes a third night in the interbranch desert. |
| Mara → House of Sleep | 767 m | Fit the easy channel crossing, day-long approach to the ridge, monster basin and moor. |
| Hot stream → Bulika | 267 m | Insert the large grassy plain and its journey. |
| Cataract → mountain city | 437 m | Give the restored river a substantial upper country before the remote mountain. |

The carriage marker's 40 m separation is not itself a proved violation: the source specifies sighting after fewer than ten paces, not reaching it. Keep real object positions independent of displaced labels and check that sightline in the eventual hall scene. This corrects an overstatement in the earlier route synthesis.

## First scale proposal

The following are **invented working ranges for traversed routes**, not book measurements, statistical uncertainty intervals or straight distances. They provide a starting size for a terrain draft. Choose positions jointly so shared journeys fit one landscape; do not assign each pair independently. Ordinary walking distances are a plausibility check, not a clock-to-kilometre conversion: time, transport and perception in this book are unusual.

| Route | Proposed first range | Basis for testing the choice |
| --- | ---: | --- |
| Low ridge → Evil Wood, including first channel belt | 20–35 km | Morning-to-evening walk; extensive rocky plain. `11.001–005` |
| Evil Wood → fruit valley, through second channel belt | 10–20 km | Afternoon approach, night in a channel, further morning travel. `11.015–12.004` |
| Mara → cataract | 20–35 km | Many desert miles; arrival near sunset. `16.001–003` |
| Cataract → first guide-forest fringe | 8–15 km | Leaves after dawn; reaches first trees about noon. `16.004–007` |
| Nest village → orchard feeding grounds | 1–4 km | Regular access to fruit while living beyond the giants' reach. `33.001–004` |
| Ivy hall → nest village | 8–18 km | The nests are still far away at the hall; travel resumes next morning. `38.008–013` |
| Nest village → Mara | 30–65 km | Direct return includes a third night in desert between the branches. `38.015–016` |
| Mara → ridge above the monster basin | 18–30 km | Starts in the morning; reaches ridge near sunset after crossing channels. `40.025–044` |
| Hot-stream crossing → Bulika | 20–45 km | Long outward walk and night approach; staged expedition and return. `20.018–22.004`, `35.001–007`, `38.001–008` |

These ranges are deliberately revisable. They suggest a country spanning **tens of kilometres**, with more country upstream, rather than the current 2.24 × 1.5 km schematic. They do not yet establish a bounding rectangle, north, exact branch widths or a solved coordinate map.

For genuinely local features, apply a different level of precision: preserve the hot stream's few-yard width; give human-sized buildings usable doors, rooms and paths; place vegetation and rocks at their own physical dimensions; provide a plausible climb at the cataract. The hall, cave and settlements can be detailed local scenes within this same connected landscape. Camera focus and labels make small objects accessible without physically enlarging them.

The candidate ranges and evidence constraints are also recorded in [the scale proposal](../research/world-scale-plan.json). It is research data, not a replacement runtime layout.

## Order of implementation

1. **Draft the whole connected country at physical scale.** Start with the fork, two broad channel systems, interbranch country, former lake basin, continuous forest, hot stream, plain and city. Move all region anchors together and draw plausible route corridors. Keep the upper river open for expansion. Use simple landforms first so travel, terrain and sightlines can be reviewed.
2. **Check the draft against both directions of travel.** Trace ridge → wood → valley → Mara → cataract → forest → stream → Bulika; Bulika → hall → nests → Mara → monster basin → House of Sleep; and House of Sleep → Mara → cataract → burial site. Check the restored bank-following journey separately. Route order, crossings, occlusion and habitats must agree without special camera tricks.
3. **Carry the cataract's art into its approaches.** Reposition or resize the current local study as needed, then develop a bounded stretch down the rocky branch toward Mara and up into the restored river's grassy banks. This tests the transition from a detailed landmark into a large country. It need not finish the entire journey at once.
4. **Build the forest and fruit-valley scenes with their own ecology.** Reuse the plant and rock-making tools, but choose forms and density from each passage. The open nest forest, rose hall, sandy desert and rocky river bed must not all inherit the cataract's planting recipe.

The first review point is the new geography draft, with journey corridors and proposed physical distances available for inspection. Additional scenery should follow that review rather than harden the old positions.
