import type { SVGProps } from 'react';

type IconName = 'plus' | 'minus' | 'overview' | 'arrow' | 'book' | 'search' | 'close';
const paths: Record<IconName, string> = {
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  overview: 'M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  book: 'M12 6v14M3 5q5-2 9 1 4-3 9-1v14q-5-2-9 1-4-3-9-1Z',
  search: 'M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  close: 'm6 6 12 12M18 6 6 18',
};

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d={paths[name]} />
  </svg>;
}
