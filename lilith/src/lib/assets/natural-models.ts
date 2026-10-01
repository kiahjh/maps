import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Project-authored metre-sized models. No terrain coordinates or scene globals.
const random = (a: number, b = 1) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
const merge = (parts: THREE.BufferGeometry[]) => {
  const merged = mergeGeometries(parts, false)!;
  parts.forEach(part => part.dispose()); return merged;
};
function branch(a: THREE.Vector3, b: THREE.Vector3, r0: number, r1: number) {
  const direction = b.clone().sub(a), geometry = new THREE.CylinderGeometry(r1, r0, direction.length(), 7, 1);
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()));
  geometry.translate(...a.clone().add(b).multiplyScalar(.5).toArray()); return geometry;
}
function leaf(length: number, width: number) {
  const vertices: number[] = [], indices: number[] = [];
  for (let i = 0; i <= 4; i++) {
    const t = i / 4, w = Math.sin(t * Math.PI) * width / 2;
    for (const side of [-1, 0, 1]) vertices.push(side * w, Math.sin(t * Math.PI) * length * .12 + Math.abs(side) * width * .10, t * length);
    if (i < 4) { const k = i * 3; indices.push(k,k+3,k+1,k+1,k+3,k+4,k+1,k+4,k+2,k+2,k+4,k+5); }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}
function tint(geometry: THREE.BufferGeometry, color: THREE.Color, seed: number) {
  const values = new Float32Array(geometry.getAttribute('position').count * 3);
  for (let i = 0; i < values.length / 3; i++) color.clone().multiplyScalar(.85 + random(seed, Math.floor(i / 15)) * .3).toArray(values, i * 3);
  geometry.setAttribute('color', new THREE.BufferAttribute(values, 3)); return geometry;
}
export function boulderGeometry(seed = 1, slab = false) {
  const geometry = new THREE.IcosahedronGeometry(1, 4), position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    // Continuous deformation keeps shared face vertices watertight.
    const shape = 1 + Math.sin(x * 4.7 + seed) * Math.cos(z * 3.9 - y * 2.2) * .095 + Math.sin(y * 7.4 + x * 3) * .028;
    const p = new THREE.Vector3(x * shape, y * shape, z * shape);
    // Intersect irregular planes to form fractured faces, rather than pebbles.
    for (const [nx, ny, nz, limit] of [[1,.35,.2,.9],[-.7,.75,.1,.85],[.1,-.8,.65,.86],[.3,.2,-1,.91]]) {
      const n = new THREE.Vector3(nx,ny,nz).normalize(), excess = p.dot(n)-limit;
      if(excess>0)p.addScaledVector(n,-excess);
    }
    position.setXYZ(i, p.x, p.y * (slab ? .38 : .65), p.z * (slab ? .8 : .92));
  }
  geometry.computeVertexNormals(); return geometry;
}
export function grassGeometry(seed = 1) {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 26; i++) {
    const h = .18 + random(seed + i, 3) * .4, angle = i * 2.399 + seed;
    const geometry = leaf(h, .018 + random(i, seed) * .012);
    geometry.rotateX(-Math.PI / 2 + .22 + random(i, 7) * .5); geometry.rotateY(angle);
    const r = random(i, seed + 4) * .22; geometry.translate(Math.cos(angle) * r, 0, Math.sin(angle) * r); parts.push(geometry);
  }
  return tint(merge(parts), new THREE.Color('#7c9250'), seed);
}
export function shrubGeometry(seed = 1) {
  const wood: THREE.BufferGeometry[] = [], leaves: THREE.BufferGeometry[] = [], flowers: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 11; i++) {
    const angle = i * 2.399 + seed, h = .35 + random(i, seed) * .5;
    const tip = new THREE.Vector3(Math.cos(angle) * .42, h, Math.sin(angle) * .42);
    wood.push(branch(new THREE.Vector3(), tip, .014, .003));
    for (let j = 0; j < 18; j++) {
      const geometry = leaf(.10 + random(j, i) * .08, .04 + random(i, j) * .04);
      geometry.rotateX(random(i + j, seed) * 2); geometry.rotateY(j * 2.399); geometry.rotateZ(random(j, seed) - .5);
      geometry.translate(tip.x + (random(i, j + 9) - .5) * .36, tip.y + (random(j, i + 8) - .5) * .25, tip.z + (random(j + 3, i) - .5) * .36); leaves.push(geometry);
    }
    if (i % 3 === 0) for (let petal = 0; petal < 5; petal++) {
      const geometry = leaf(.042, .026); geometry.rotateY(petal * Math.PI * 2 / 5); geometry.translate(tip.x, tip.y + .17, tip.z); flowers.push(geometry);
    }
  }
  return { wood: merge(wood), leaves: tint(merge(leaves), new THREE.Color('#57743b'), seed), flowers: tint(merge(flowers), new THREE.Color('#e9dfbd'), seed) };
}
export function wildflowerGeometry(seed = 1) {
  const stems: THREE.BufferGeometry[] = [], flowers: THREE.BufferGeometry[] = [];
  const colour = new THREE.Color(['#eee4c6', '#b9abc2', '#d3bc76'][seed % 3]);
  for (let i = 0; i < 12; i++) {
    const angle = i * 2.399 + seed, radius = Math.sqrt(random(i, seed)) * .38;
    const root = new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    const tip = root.clone().add(new THREE.Vector3((random(i, 8) - .5) * .10, .25 + random(i, seed + 2) * .26, (random(i, 9) - .5) * .10));
    const stem = branch(root, tip, .004, .002); stem.deleteAttribute('uv'); stems.push(stem);
    for (let j = 0; j < 3; j++) {
      const blade = leaf(.095, .027); blade.rotateX(-.45); blade.rotateY(angle + j * 2.4);
      blade.translate(...root.clone().lerp(tip, .2 + j * .17).toArray()); stems.push(blade);
    }
    for (let petal = 0; petal < 5; petal++) {
      const geometry = leaf(.055, .032); geometry.rotateY(petal * Math.PI * 2 / 5 + angle);
      geometry.translate(...tip.toArray()); flowers.push(tint(geometry, colour, seed + i));
    }
    const centre = new THREE.SphereGeometry(.014, 6, 4); centre.deleteAttribute('uv'); centre.translate(...tip.toArray());
    flowers.push(tint(centre, new THREE.Color('#d7bd75'), seed));
  }
  return { stems: tint(merge(stems), new THREE.Color('#68834a'), seed), flowers: merge(flowers) };
}
export function treeGeometry(seed = 1) {
  const wood: THREE.BufferGeometry[] = [], leaves: THREE.BufferGeometry[] = [];
  const h = 8 + random(seed, 2) * 3;
  const trunk = [new THREE.Vector3(), new THREE.Vector3(.14, h * .35, .1), new THREE.Vector3(-.1, h * .68, .3), new THREE.Vector3(.25, h, .1)];
  for (let i = 1; i < trunk.length; i++) wood.push(branch(trunk[i - 1], trunk[i], .24 * (1 - (i - 1) / 3) + .04, .24 * (1 - i / 3) + .035));
  for (let tier = 0; tier < 3; tier++) for (let arm = 0; arm < 6; arm++) {
    const n = tier * 6 + arm, angle = arm * Math.PI / 3 + tier * .8 + seed;
    const spread = (3.1 - tier * .55) * (.8 + random(n, seed) * .35);
    const root = new THREE.Vector3(.1, h * (.38 + tier * .18), .15);
    const tip = new THREE.Vector3(Math.cos(angle) * spread, root.y + 1.1 + random(n, seed) * 1.4, Math.sin(angle) * spread);
    wood.push(branch(root, tip, .09 - tier * .018, .015));
    for (let twig = 0; twig < 5; twig++) {
      const t = .4 + twig * .13, base = root.clone().lerp(tip, t);
      const end = base.clone().add(new THREE.Vector3(Math.cos(angle + twig) * .85, .5 + random(twig, n) * .65, Math.sin(angle + twig) * .85));
      wood.push(branch(base, end, .02, .004));
      for (let j = 0; j < 36; j++) {
        const geometry = leaf(.28 + random(j, n) * .23, .14 + random(n, j) * .10);
        geometry.rotateX(random(n + j, seed) * 2.6); geometry.rotateY(j * 2.399 + n); geometry.rotateZ(random(j, seed) * 1.2 - .6);
        geometry.translate(end.x + (random(n + j, 8) - .5) * 1.15, end.y + (random(j, n + 9) - .5) * .75, end.z + (random(j + 7, n) - .5) * 1.15);
        leaves.push(geometry);
      }
    }
  }
  return { wood: merge(wood), leaves: tint(merge(leaves), new THREE.Color('#64824b'), seed) };
}
export function scaleFigureGeometry() {
  const parts: THREE.BufferGeometry[] = [];
  const head = new THREE.SphereGeometry(.11, 12, 8); head.translate(0, 1.68, 0); parts.push(head);
  const torso = new THREE.CylinderGeometry(.16, .12, .58, 8); torso.translate(0, 1.27, 0); parts.push(torso);
  for (const side of [-1, 1]) {
    parts.push(branch(new THREE.Vector3(side * .08, 1, 0), new THREE.Vector3(side * .11, .05, 0), .065, .045));
    parts.push(branch(new THREE.Vector3(side * .17, 1.5, 0), new THREE.Vector3(side * .22, .91, .02), .045, .035));
  }
  return merge(parts);
}
