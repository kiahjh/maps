import { layout, nameFor, places, pointFor, source } from '../data/atlas';
import type { Landscape } from '../types';
import { Icon } from './Icon';

interface Props { selected: string; landscape: Landscape; onSelect: (id: string) => void; onClose: () => void }

export function PlaceDetails({ selected, landscape, onSelect, onClose }: Props) {
  const place = places[selected];
  const paragraphIndex = selected === 'cataract' && landscape === 'restored' ? 1 : 0;
  const note = layout.notes[selected] ?? layout.notes[pointFor(selected)?.id ?? ''];
  const related = layout.related[selected] ?? [];
  return <section className="place-details" aria-label="Selected place" aria-live="polite">
    <div className="place-heading">
      <h2>{nameFor(selected, landscape)}</h2>
      <button type="button" className="close-panel" onClick={onClose} aria-label="Close place details"><Icon name="close" /></button>
    </div>
    <p className="place-state">{place.state}</p>
    <div className="place-prose"><p>{place.paragraphs[paragraphIndex]}</p></div>
    {note && <div className="field-note"><p>{note}</p></div>}
    {related.length > 0 && <div className="related-places">
      <h3>Connected places</h3>
      {related.map(id => <button type="button" key={id} onClick={() => onSelect(id)}>
        <span>{nameFor(id, landscape)}</span><Icon name="arrow" />
      </button>)}
    </div>}
    <details className="source-details">
      <summary><Icon name="book" /><span>Context & source passages</span><span className="source-count">{place.refs.length}</span></summary>
      <div className="source-content">
        {place.paragraphs.filter((_, i) => i !== paragraphIndex).map((text, i) => <p key={i}>{text}</p>)}
        {place.refs.map(id => <blockquote key={id}>
          <a href={source[id].source_url} target="_blank" rel="noreferrer">Chapter {source[id].chapter} · paragraph {id} ↗</a>
          <p>{source[id].text}</p>
        </blockquote>)}
        <p className="source-footnote">Paragraph IDs are locators for this research edition.</p>
      </div>
    </details>
  </section>;
}
