import { memo } from 'react';
import { outlines, vegetation, waterways } from '../../data/terrain';
import type { Landscape } from '../../types';

export function MapPatterns() {
  return <defs>
    <pattern id="sand" width="45" height="39" patternUnits="userSpaceOnUse">
      <path d="M4 6l10-1m18 18l5 1M13 33l6-1" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".17" />
    </pattern>
    <pattern id="grass" width="39" height="42" patternUnits="userSpaceOnUse">
      <path d="M8 25l-2-6m2 6l3-4M26 9l-1-5m1 5l3-3" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".22" />
    </pattern>
    <pattern id="water-lines" width="42" height="35" patternUnits="userSpaceOnUse">
      <path d="M3 10q8-3 15 0t15 0M12 27q7-3 14 0" fill="none" stroke="var(--water)" strokeWidth="1.3" opacity=".55" />
    </pattern>
  </defs>;
}

function Landforms() {
  return <g data-layer="landforms">
    <path d={outlines.pine} className="forest-edge" />
    <path d={outlines.cemetery} className="land" />
    <path d={outlines.upper} className="land" />
    <path d={outlines.ravines} className="land" />
    <path d={outlines.upper} fill="url(#sand)" />
    <path d={outlines.ravines} fill="url(#sand)" />
    <path d={outlines.forest} className="forest-edge" />
    <path d={outlines.evil} className="forest-edge" />
    <path d={outlines.plain} fill="url(#grass)" />
    <path d={outlines.basin} className="land" />
    <path d={outlines.monsters} className="land" />
    {vegetation.trees.map(({ x, y, size: s, dark }, index) => <g key={index} transform={`translate(${x} ${y})`} opacity={dark ? .86 : .7}>
      <path className="tree" d={`M0 0L${-s*.6} ${s*.7}L${-s*.3} ${s*.7}L${-s*.75} ${s*1.2}L${-s*.25} ${s*1.2}L${-s*.8} ${s*1.65}L${s*.8} ${s*1.65}L${s*.3} ${s*1.2}L${s*.7} ${s*1.2}L${s*.3} ${s*.7}L${s*.6} ${s*.7}Z M0 ${s*1.65}v${s*.3}`} />
    </g>)}
    {vegetation.fruit.map(({ x, y, radius }, index) => <g key={index} transform={`translate(${x} ${y})`}>
      <circle r={radius} className="building" fillOpacity=".6" strokeOpacity=".32" />
      <path d="M0 15v13" className="tree" />
    </g>)}
    {Array.from({ length: 6 }, (_, i) => <path key={`low-${i}`} d={`M495 ${948+i*62}Q535 ${886+i*62} 585 ${958+i*62}M501 ${953+i*62}q39-48 74 3`} className="contour" />)}
    {Array.from({ length: 7 }, (_, i) => <path key={`sand-${i}`} d={`M${711+i*32} 917q30-54 58-24`} className="contour" />)}
    {Array.from({ length: 5 }, (_, i) => <path key={`hill-${i}`} d={`M${1682+i*34} 590l29-82 40 83m-65-6 24-44 18 41`} className="ink" />)}
  </g>;
}

function Waterways({ landscape }: { landscape: Landscape }) {
  return <g data-layer="waterways">
    {landscape === 'dry' ? [waterways.first, waterways.second].map((d, i) => <g key={i}>
      <path d={d} className="river-bed" /><path d={d} className="river-bed-center" />
    </g>) : <>
      {[waterways.upper, waterways.first, waterways.second].map((d, i) => <path key={i} d={d} className="river" />)}
      <path d={outlines.monsters} className="lake" />
      <path d={outlines.monsters} fill="url(#water-lines)" />
      <path d={outlines.basin} className="projected-lake" />
      <path d={outlines.basin} fill="url(#water-lines)" opacity=".45" />
      {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${766+i*31} 455Q${790+i*31} 370 ${862+i*31} 333`} className="contour" />)}
    </>}
    <path d={waterways.hot} className="hot-stream" />
    {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M${839+i*15} 572l9 28m-5-23 5 24`} className="ink" />)}
  </g>;
}

function MountainCity() {
  return <g data-layer="mountain-city">
    <path d="M821 275C862 215 957 158 984 86L1058 35 1130 113 1199 246 1292 283" className="contour" />
    <path d="M930 187l112-116 63 119m-144-31 61-39 56 17m-63-53 35 41" className="ink" />
    {Array.from({ length: 8 }, (_, i) => <rect key={i} x={981+i*12} y={172-(i%3)*13} width="9" height={17+(i%3)*5} className="building" />)}
    <path d="M1041 166l-9 30m-2-13-21 15m27-4-19 19" className="river" />
    <path d="M1015 93q24-22 44-3q25-17 42 3m-84-7q-15-14 0-22q25-8 44 7" className="contour" />
  </g>;
}

function EarthlyInset() {
  return <g data-layer="earthly-inset">
    <rect x="82" y="170" width="410" height="222" rx="10" fill="var(--paper)" stroke="var(--line)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
    <path d="M137 277l62-45 75 44m-127-5v77h117v-77M183 348v-38h25v38M217 309h21v19h-21Z M157 308h13v19h-13Z" className="ink" />
    <ellipse cx="352" cy="312" rx="40" ry="15" className="contour" />
    <path d="M352 307v-53m-14 6q14-18 28 0" className="contour" />
    <path d="M166 392C118 503 119 646 201 740" className="portal" />
    <path d="M201 390C129 589 37 820 164 1166" className="portal" />
  </g>;
}

function Cottage({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}>
    <path d="M-31 0l29-23 35 23M-23-3v39h51V-3M-5 36V15h16v21M-17 7h9v10h-9Z" className="building" />
  </g>;
}

function Buildings() {
  return <g data-layer="buildings">
    <Cottage x={180} y={1180} /><Cottage x={840} y={790} />
    <path d="M1945 999Q2021 929 2108 995L2130 1091Q2037 1143 1950 1100Z" className="building" />
    <path d="M1953 993v-20h12v25m31-20v-20h12v15m85 11v-22h13v27m19 76h18v12h-18m-160 0h-17v12h18" className="ink" />
    <path d="M2017 1009h58v-26h-8v-20h-9v20h-31v-20h-10Zm12-27q17-28 28 0" className="building" />
    <path d="M2018 1082L2030 1017M2018 1082l-61 2m61-2 91 6" className="contour" />
    {Array.from({ length: 19 }, (_, i) => {
      const angle = i*2.399, x = 2020+Math.cos(angle)*(30+(i%4)*13), y = 1069+Math.sin(angle)*(19+(i%3)*9);
      return y < 1032 ? null : <rect key={i} x={x} y={y} width="8" height="9" className="building" strokeOpacity=".3" />;
    })}
    {Array.from({ length: 4 }, (_, i) => <path key={i} d={`M1931 ${1015+i*26}l-24 9m28-4-24 9`} className="contour" />)}
    <path d="M1478 788q52-51 110 3l-5 58q-45 13-93-2Z M1496 844v-33h40v35" className="contour" />
    <path d="M1499 821l-9 13m50-13 12 15" className="contour" />
    <ellipse cx="1716" cy="597" rx="14" ry="9" className="building" />
  </g>;
}

export const MapTerrain = memo(function MapTerrain({ landscape }: { landscape: Landscape }) {
  return <>
    <Landforms />
    <Waterways landscape={landscape} />
    {landscape === 'restored' && <MountainCity />}
    <EarthlyInset />
    <Buildings />
  </>;
});
