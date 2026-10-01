import { describe, expect, it } from 'vitest';
import { ascent, cataract, cataractWaterLevel } from './cataract';
import { cataractZone, elevationAt, rivers } from './landscape';
import { waterGeometry } from './waterways';
import { scaleFigureGeometry } from './assets/natural-models';

describe('dimensioned cataract study', () => {
  it('has a 38 metre water drop and a human sized reference', () => {
    expect(cataractWaterLevel(890, cataract.lip) - cataractWaterLevel(890, cataract.foot)).toBe(cataract.drop);
    const reference = scaleFigureGeometry(); reference.computeBoundingBox();
    const height = reference.boundingBox!.max.y - reference.boundingBox!.min.y;
    expect(height).toBeGreaterThan(1.7); expect(height).toBeLessThan(1.85); reference.dispose();
  });
  it('keeps the ascent broad and below a 40 percent grade along its centre', () => {
    for(let i=1;i<ascent.length;i++) {
      const a=ascent[i-1],b=ascent[i];
      expect(Math.abs(b.height-a.height)/Math.hypot(b.x-a.x,b.y-a.y)).toBeLessThan(.4);
      const x=(a.x+b.x)/2,y=(a.y+b.y)/2;
      expect(Math.abs(elevationAt(x+2,y)-elevationAt(x-2,y))).toBeLessThan(4);
    }
  });
  it('keeps the central flowing water above its carved bed through the drop', () => {
    for(const river of rivers.slice(0,3)) {
      const geometry=waterGeometry(river),position=geometry.getAttribute('position');
      const uv=geometry.getAttribute('uv');
      let samples=0,minClearance=Infinity;
      for(let i=0;i<position.count;i++) {
        const x=position.getX(i),y=position.getZ(i),height=position.getY(i);
        expect(Number.isFinite(height)).toBe(true);
        if(cataractZone(x,y)<.999 || y<580 || y>625 || uv.getX(i)<.1 || uv.getX(i)>.9)continue;
        minClearance=Math.min(minClearance,height-elevationAt(x,y));samples++;
      }
      expect(samples).toBeGreaterThan(10); expect(minClearance).toBeGreaterThan(0);
      geometry.dispose();
    }
  });
});
