"""Rebuild the archived standalone map with Python's standard library only."""
from pathlib import Path
import importlib.util
import json

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'research/lilith-geography-evidence.json').read_text())
layout = json.loads((ROOT / 'src/map-layout.json').read_text())
places = {p['id']: p for p in data['gazetteer']}
paragraphs = data['source']['epigraph'] + [p for c in data['source']['chapters'] for p in c['paragraphs']]
by_id = {p['id']: p for p in paragraphs}
used = {p['id'] for p in layout['places']}
for parent, children in layout['related'].items():
    used.add(parent)
    used.update(children)
assert used <= places.keys(), 'Unknown place in map layout.'
refs = {r for pid in used for r in places[pid]['refs']}
assert refs <= by_id.keys(), 'Missing original source paragraph.'
names = {p['id']: p['label'] for p in layout['places']}
names.update({'library': 'Library & closet', 'garret': 'Garret mirror', 'church': 'Ruined church', 'lost-tower': 'Lost tower', 'sexton': 'Sexton’s cottage', 'palace-passages': 'Vestibule & passages', 'black-hall': 'Black-marble hall', 'guest-room': 'Guest room & bath', 'alabaster': 'Alabaster room', 'palace-tree': 'Courtyard tree', 'citizen-house': 'Citizen’s stair', 'cellars': 'Gem cellars', 'water-trail': 'Water trail'})
payload = {'layout': layout, 'places': {pid: places[pid] for pid in sorted(used)}, 'source': {r: by_id[r] for r in sorted(refs)}, 'shortNames': names}
encoded = json.dumps(payload, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
template = (ROOT / 'legacy/map-template.html').read_text()
assert template.count('__MAP_DATA__') == 1
fragment = template.replace('__MAP_DATA__', encoded)
assert len(fragment.encode()) < 1_000_000
build = ROOT / 'build'
build.mkdir(exist_ok=True)
fragment_path = build / 'map-fragment.html'
fragment_path.write_text(fragment)

renderer_path = ROOT / 'vendor/visualize/scripts/render.py'
spec = importlib.util.spec_from_file_location('lilith_export', renderer_path)
renderer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(renderer)
renderer.export_html(fragment_path, ROOT / 'legacy/index.html', title='Lilith · Interactive Map', force=True)
print(f'Built {ROOT / "legacy/index.html"}')
print(f'{len(layout["places"])} mapped places, {len(used)} context entries, {len(refs)} original paragraphs.')
