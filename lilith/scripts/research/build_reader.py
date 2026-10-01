from pathlib import Path
import csv
import json
import re
from collections import Counter
from dossier import sections, places, routes, unresolved

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / 'sources'
OUT = ROOT / 'research'
OUT.mkdir(parents=True, exist_ok=True)
source = json.loads((WORK / 'source.json').read_text())
all_paragraphs = source['epigraph'] + [p for c in source['chapters'] for p in c['paragraphs']]
by_id = {p['id']: p for p in all_paragraphs}
chapter_paragraphs = {0: source['epigraph']}
chapter_paragraphs.update({c['number']: c['paragraphs'] for c in source['chapters']})
raw_entries = list(csv.DictReader((WORK / 'annotations.tsv').open(), delimiter='\t'))
raw_entries.sort(key=lambda r: tuple(map(int, r['start'].split('.'))))
entries = []
covered = set()
for i, r in enumerate(raw_entries, 1):
    ch, a = map(int, r['start'].split('.'))
    ch2, b = map(int, r['end'].split('.'))
    assert ch == ch2 and a <= b
    pids = [f'{ch:02d}.{n:03d}' for n in range(a, b + 1)]
    assert all(p in by_id for p in pids), r
    covered.update(pids)
    before, after = f'{ch:02d}.{a-1:03d}', f'{ch:02d}.{b+1:03d}'
    entries.append({
        'id': f'E{i:03d}', 'chapter': ch, 'start': r['start'], 'end': r['end'],
        'kind': r['kind'], 'places': [p.strip() for p in r['places'].split(';')],
        'note': r['note'], 'paragraph_ids': pids,
        'neighbor_before': before if before in by_id else None,
        'neighbor_after': after if after in by_id else None,
        'source_url': by_id[pids[0]]['source_url']
    })

# These short blocks were read in the final omission audit. They contain
# dialogue, emotion or narrative glue; none adds a distinct geographical fact.
excluded = []
for p in all_paragraphs:
    if p['id'] not in covered:
        reason = 'Read: brief dialogue, reaction, or narrative connector; no additional place description or geographical relationship.'
        if p['id'] == '13.068':
            reason = 'Read: anxiety about selfishness and growth; its world/inhabitant implications are retained in the surrounding giant-growth evidence groups.'
        elif p['id'] == '44.024':
            reason = 'Read: aphorism about morning always being at hand, not a separate weather observation or measured time interval.'
        elif p['id'] == '33.018':
            reason = 'Read: reflection on children’s growth and Lona’s practical wisdom; no new place or spatial detail.'
        excluded.append({'paragraph_id': p['id'], 'reason': reason, 'text': p['text']})

chapter_audit = []
for n, ps in chapter_paragraphs.items():
    chapter_audit.append({
        'chapter': n,
        'title': 'Thoreau epigraph' if n == 0 else source['chapters'][n-1]['title'],
        'blocks_read': len(ps), 'blocks_in_evidence_spans': sum(p['id'] in covered for p in ps),
        'evidence_groups': sum(e['chapter'] == n for e in entries),
        'read_not_separately_selected': [p['id'] for p in ps if p['id'] not in covered]
    })

stats = {
    'chapters': len(source['chapters']), 'source_blocks_including_epigraph_and_notes': len(all_paragraphs),
    'chapter_body_blocks_including_terminal_notes': sum(len(c['paragraphs']) for c in source['chapters']),
    'chapter_body_words_including_terminal_notes': sum(len(p['text'].split()) for c in source['chapters'] for p in c['paragraphs']),
    'evidence_groups': len(entries), 'blocks_in_evidence_spans': len(covered),
    'read_not_separately_selected': len(excluded), 'gazetteer_entries': len(places),
    'route_constraints': len(routes), 'evidence_types': dict(Counter(e['kind'] for e in entries))
}

place_ids = {p['id'] for p in places}
for r in routes:
    assert r['from'] in place_ids and r['to'] in place_ids
for x in places + routes:
    assert all(ref in by_id for ref in x['refs']), x
for section in sections:
    for paragraph in section['paragraphs']:
        for ref in re.findall(r'\b\d{2}\.\d{3}\b', paragraph):
            assert ref in by_id, (section['id'], ref)

data = {
    'schema': 'lilith-world-context/1.0', 'source': source,
    'method': 'Complete sequential reading of all 47 chapters, epigraph and endnotes; chapter annotations; two broad lexical/spatial omission sweeps; final review of every unselected block. Gazetteer and route synthesis use this edition exclusively.',
    'stats': stats, 'sections': sections, 'gazetteer': places, 'routes': routes,
    'unresolved_questions': unresolved, 'evidence_groups': entries,
    'coverage': {'chapters': chapter_audit, 'read_not_separately_selected': excluded},
    'evidence_type_definitions': {
        'observed': 'Narrated experience; not a guarantee of ordinary physical reality.',
        'reported': 'Character testimony, history, directions or hearsay; qualifications retained.',
        'transition': 'Experienced change or passage between settings.',
        'world-rule': 'Space, time, perception, access and spiritual-state explanations.',
        'dream': 'Explicitly dream or later reclassified as dream; corroboration recorded separately.',
        'imagined': 'Unrealized speculation, fantasy or proposed construction.',
        'reference': 'Backstory, comparison, epigraph or literary apparatus.'
    }
}
(OUT / 'lilith-geography-evidence.json').write_text(json.dumps(data, ensure_ascii=False, indent=2))

text = [
    'LILITH — WORLD CONTEXT AND GEOGRAPHICAL EVIDENCE', 'George MacDonald',
    'Source: ' + source['source_url'], 'Prepared: ' + source['retrieved'],
    'No secondary sources, illustrations or map construction used.',
    f"Complete reading: {stats['chapters']} chapters; {stats['evidence_groups']} grouped evidence spans; {stats['gazetteer_entries']} gazetteer entries; {stats['route_constraints']} route constraints.",
    'The HTML reader and structured JSON retain all original source paragraphs. This text file contains the synthesis and every catalogue note. The separate indexed-text file contains the complete book.',
    'Paragraph IDs are research locators for this edition, not printed page numbers.', ''
]
for s in sections:
    text.extend([s['title'].upper(), '', *[p + '\n' for p in s['paragraphs']]])
text.extend(['PLACE-BY-PLACE GAZETTEER', ''])
for p in places:
    text.extend([p['title'], 'State: ' + p['state'], 'Source locators: ' + '; '.join(p['refs']), '', *[v + '\n' for v in p['paragraphs']]])
text.extend(['ROUTE AND RELATIONSHIP RECORD', ''])
titles = {p['id']: p['title'] for p in places}
for i, r in enumerate(routes, 1):
    text.extend([f"R{i:02d}. {titles[r['from']]} → {titles[r['to']]}", r['relationship'], 'Evidence status: ' + r['status'], 'Source: ' + '; '.join(r['refs']), ''])
text.extend(['UNRESOLVED BEFORE ANY MAP', '', *['• ' + v for v in unresolved], '', 'COMPLETE ANNOTATED PASSAGE CATALOGUE', ''])
for e in entries:
    text.extend([f"{e['id']} | {e['start']}–{e['end']} | {e['kind']}", 'Places/topics: ' + '; '.join(e['places']), e['note'], 'Original chapter: ' + e['source_url'], ''])
text.extend(['COVERAGE AUDIT', '', 'All source blocks were read. Broad spans include surrounding dialogue and do not imply every included sentence is itself geographical.', f"{len(covered)} of {len(all_paragraphs)} source blocks occur within evidence spans; {len(excluded)} short blocks were read but not separately selected.", ''])
for a in chapter_audit:
    text.append(f"{a['chapter']:02d}: {a['blocks_read']} blocks read; {a['blocks_in_evidence_spans']} in evidence spans; {a['evidence_groups']} groups. {a['title']}")
text.extend(['', 'Read blocks not separately selected:'])
for p in excluded:
    text.append(p['paragraph_id'] + ': ' + p['reason'])
text.extend(['', 'SOURCE PROVENANCE', 'Normalized from saved HTML. ' + source['normalization'], 'Saved HTML SHA-256: ' + source['source_sha256']])
(OUT / 'lilith-world-context.txt').write_text('\n'.join(text), encoding='utf-8')

with (OUT / 'lilith-passage-catalogue.csv').open('w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['id','chapter','start','end','dominant_evidence_type','places_and_topics','research_note','original_source_url','verbatim_span','neighbor_before','neighbor_after'])
    for e in entries:
        writer.writerow([e['id'],e['chapter'],e['start'],e['end'],e['kind'],'; '.join(e['places']),e['note'],e['source_url'],
                         '\n\n'.join(f"[{pid}] {by_id[pid]['text']}" for pid in e['paragraph_ids']),
                         by_id[e['neighbor_before']]['text'] if e['neighbor_before'] else '',
                         by_id[e['neighbor_after']]['text'] if e['neighbor_after'] else ''])

template = (ROOT / 'src/research/reader-template.html').read_text()
payload = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
(OUT / 'lilith-world-context.html').write_text(template.replace('__DATA__', payload), encoding='utf-8')
print(json.dumps(stats, indent=2))
print('Deliverables built. All referenced paragraph IDs and route endpoints validated.')
