"""Validate and prepare the map's evidence subset and static research reader."""
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
evidence = json.loads((ROOT / 'research/lilith-geography-evidence.json').read_text())
layout = json.loads((ROOT / 'src/map-layout.json').read_text())
places = {p['id']: p for p in evidence['gazetteer']}
paragraphs = evidence['source']['epigraph'] + [
    p for chapter in evidence['source']['chapters'] for p in chapter['paragraphs']
]
by_id = {p['id']: p for p in paragraphs}
used = {p['id'] for p in layout['places']}
for parent, children in layout['related'].items():
    used.add(parent)
    used.update(children)
assert used <= places.keys(), 'Unknown place in map layout.'
refs = {ref for pid in used for ref in places[pid]['refs']}
assert refs <= by_id.keys(), 'Missing source paragraph.'
payload = {
    'places': {pid: places[pid] for pid in sorted(used)},
    'source': {ref: by_id[ref] for ref in sorted(refs)},
}
destination = ROOT / 'src/data/map-evidence.json'
destination.parent.mkdir(parents=True, exist_ok=True)
encoded = json.dumps(payload, ensure_ascii=False, indent=2) + '\n'
if not destination.exists() or destination.read_text() != encoded:
    destination.write_text(encoded)
# The dossier stays independently editable and downloadable, outside the JS bundle.
public = ROOT / 'public/research'
public.mkdir(parents=True, exist_ok=True)
for path in (ROOT / 'research').iterdir():
    if path.is_file():
        shutil.copy2(path, public / path.name)
print(f'Prepared {len(used)} places and {len(refs)} source paragraphs; copied research reader.')
