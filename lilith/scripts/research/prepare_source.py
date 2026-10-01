from html.parser import HTMLParser
from pathlib import Path
import re, json, hashlib

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / 'sources'
OUT = ROOT / 'research'
URL = 'https://www.gutenberg.org/files/1640/1640-h/1640-h.htm'
raw = (WORK / 'source.html').read_text(encoding='utf-8')

class Blocks(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.active = None
        self.parts = []
        self.blocks = []
        self.line = 0
    def handle_starttag(self, tag, attrs):
        if tag in ('p', 'pre', 'h2'):
            if self.active:
                self.finish()
            self.active = tag
            self.parts = []
            self.line = self.getpos()[0]
        elif tag == 'br' and self.active:
            self.parts.append('\n')
    def handle_endtag(self, tag):
        if self.active == tag:
            self.finish()
    def handle_data(self, data):
        if self.active:
            self.parts.append(data)
    def finish(self):
        text = ''.join(self.parts)
        if self.active == 'pre':
            text = '\n'.join(x.strip() for x in text.strip().splitlines())
        else:
            text = re.sub(r'\s+', ' ', text).strip()
        if text:
            self.blocks.append({'kind':self.active, 'text':text, 'local_line':self.line})
        self.active = None
        self.parts = []

anchors = list(re.finditer(r'<a id="(link2HCH\d{4})">', raw))
chapters = []
for i, a in enumerate(anchors):
    end = anchors[i+1].start() if i+1 < len(anchors) else raw.index('*** END OF THE PROJECT GUTENBERG')
    segment = raw[a.start():end]
    parser = Blocks()
    parser.feed(segment)
    parser.close()
    title = next(x['text'] for x in parser.blocks if x['kind']=='h2')
    paras = [x for x in parser.blocks if x['kind'] in ('p','pre')]
    offset = raw[:a.start()].count('\n')
    for j, p in enumerate(paras, 1):
        p['id'] = f'{i+1:02d}.{j:03d}'
        p['chapter'] = i+1
        p['paragraph'] = j
        p['source_line'] = offset + p.pop('local_line')
        p['source_url'] = URL+'#'+a.group(1)
    chapter = {'number':i+1, 'title':title, 'anchor':a.group(1), 'paragraphs':paras}
    chapters.append(chapter)
    (WORK/f'chapter-{i+1:02d}.txt').write_text(title+'\n\n'+'\n\n'.join(f"[{p['id']}] {p['text']}" for p in paras),encoding='utf-8')

ep_parser = Blocks()
ep_start = raw.index('I took a walk on Spaulding')
ep_start = raw.rfind('<p>',0,ep_start)
ep_parser.feed(raw[ep_start:anchors[0].start()])
epigraph = []
for j, p in enumerate([x for x in ep_parser.blocks if x['kind'] in ('p','pre')],1):
    p.update({'id':f'00.{j:03d}','chapter':0,'paragraph':j,'source_url':URL,'source_line':raw[:ep_start].count('\n')+p.pop('local_line')})
    epigraph.append(p)

data = {'title':'Lilith','author':'George MacDonald','source_url':URL,'retrieved':'2026-09-30','source_sha256':hashlib.sha256(raw.encode()).hexdigest(),'normalization':'HTML tags removed; entities decoded; prose whitespace collapsed. Verse line breaks retained. Paragraph IDs are local research locators, not printed page numbers.','epigraph':epigraph,'chapters':chapters}
(WORK/'source.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'lilith-paragraph-indexed-text.txt').write_text('LILITH — GEORGE MACDONALD\nSource: '+URL+'\nResearch paragraph IDs refer to this edition only.\n\nEPIGRAPH (Thoreau; not the fictional geography)\n\n'+'\n\n'.join(f"[{p['id']}] {p['text']}" for p in epigraph)+'\n\n'+'\n\n'.join((WORK/f"chapter-{c['number']:02d}.txt").read_text() for c in chapters),encoding='utf-8')
print('Chapters:',len(chapters))
print('Narrative blocks:',sum(len(c['paragraphs']) for c in chapters))
print('Narrative words:',sum(len(p['text'].split()) for c in chapters for p in c['paragraphs']))
print('Epigraph blocks:',len(epigraph))
for c in chapters:
    print(f"{c['number']:02d}: {len(c['paragraphs'])} blocks, {sum(len(p['text'].split()) for p in c['paragraphs'])} words: {c['title']}")
