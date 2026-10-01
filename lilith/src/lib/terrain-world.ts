import * as THREE from 'three';
import { cataractZone, elevationAt, hash, noise, scarpLine, terrainSample } from './landscape';
import type { Camera, Landscape, Size } from '../types';
import { cameraPose, flyFov, scaleFor } from './camera';
import { applyTerrainSurface } from './terrain-surface';
import { naturalMaterials } from './assets/materials';
import { createCataractDetails } from './cataract-details';
import { createWaterways } from './waterways';

type Sample = ReturnType<typeof terrainSample>;
const water = { value: 0 };
const palette = {
  earth: new THREE.Color('#a49a76'), sand: new THREE.Color('#cfbb8f'), meadow: new THREE.Color('#8b9c6d'),
  forest: new THREE.Color('#637451'), evil: new THREE.Color('#354d43'), rock: new THREE.Color('#a29882'),
  bank: new THREE.Color('#74967b'), bed: new THREE.Color('#afa58d'),
};
function terrainColor(sample: Sample, wet: boolean, x: number, y: number) {
  const color = palette.earth.clone();
  color.lerp(wet ? palette.meadow : palette.sand, sample.sand * .93);
  color.lerp(palette.forest, sample.forest * .82);
  color.lerp(palette.evil, sample.evil * .9);
  color.lerp(palette.rock, sample.cliff * .96);
  if (wet) color.lerp(palette.bank, sample.bank * .5);
  else if (!sample.river.upper) color.lerp(palette.bed, sample.channel * .78);
  color.lerp(new THREE.Color('#798257'), sample.moss * .7);
  color.multiplyScalar(.87 + sample.broad * .17 + noise(x / 8, y / 8) * .09);
  return color;
}

function groundMesh(blend: { value: number }) {
  // Refine the falls while retaining a single, watertight mesh for the land.
  const axis = (start: number, end: number, fineStart: number, fineEnd: number) => {
    const values: number[] = [];
    for (let value = start; value < end; value += 7) {
      values.push(value);
      if ((start === -450 && value >= 562 && value < 639) || (start === -480 && value >= 740 && value < 1130)) { for (let j = 1; j < 10; j++) values.push(value + j * .7); }
      else if (value >= fineStart && value < fineEnd) values.push(value + 7 / 3, value + 14 / 3);
    }
    values.push(end); return values;
  };
  const xs = axis(-480, 2720, 620, 1210), ys = axis(-450, 2000, 460, 820);
  const columns = xs.length - 1, rows = ys.length - 1;
  const count = (columns + 1) * (rows + 1);
  const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3);
  const surface = new Float32Array(count * 3);
  const wetColors = new Float32Array(count * 3), fill = new Float32Array(count);
  for (let row = 0; row <= rows; row++) for (let column = 0; column <= columns; column++) {
    const x = xs[column], y = ys[row], i = row * (columns + 1) + column;
    const sample = terrainSample(x, y);
    positions.set([x, sample.height, y], i * 3);
    terrainColor(sample, false, x, y).toArray(colors, i * 3);
    terrainColor(sample, true, x, y).toArray(wetColors, i * 3);
    fill[i] = sample.sandFill;
    surface.set([sample.local, sample.cliff, sample.moss], i * 3);
  }
  const indices = new Uint32Array(columns * rows * 6);
  let cursor = 0;
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const a = row * (columns + 1) + column, b = a + 1, c = a + columns + 1, d = c + 1;
    indices.set([a, c, b, b, c, d], cursor); cursor += 6;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('wetColor', new THREE.BufferAttribute(wetColors, 3));
  geometry.setAttribute('surface', new THREE.BufferAttribute(surface, 3));
  geometry.setAttribute('sandFill', new THREE.BufferAttribute(fill, 1));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
  applyTerrainSurface(material, blend);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true; mesh.castShadow = true;
  return mesh;
}

interface Tree { x: number; y: number; height: number; radius: number; evil: boolean; seed: number }
function forestMeshes() {
  const permanent: Tree[] = [], restored: Tree[] = [];
  for (let y = 40; y < 1490; y += 12) for (let x = 55; x < 2200; x += 12) {
    const seed = hash(x, y);
    const px = x + (hash(x + 7, y) - .5) * 14, py = y + (hash(x, y + 4) - .5) * 14;
    const sample = terrainSample(px, py);
    if (cataractZone(px, py) > .92) continue;
    if (sample.distance < sample.river.width + 8 || Math.abs(py - scarpLine(px)) < 25) continue;
    const clearing = Math.hypot(px - 840, py - 790) < 23 || Math.hypot(px - 1240, py - 1280) < 70;
    if (clearing) continue;
    const tree = { x: px, y: py, height: 8 + seed * 13, radius: 4 + hash(x + 13, y) * 4.8, evil: sample.evil > .5, seed };
    if (seed < sample.forest * .91) permanent.push(tree);
    else if (hash(x + 71, y) < sample.regrowth * .13 && sample.sand + sample.bank > .3) restored.push(tree);
  }
  const leavesGeometry = new THREE.IcosahedronGeometry(1, 1);
  // Irregular crowns share geometry, while every tree has its own scale and hue.
  const position = leavesGeometry.getAttribute('position');
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    const swell = .9 + hash(x * 21 + 2, z * 19 + y * 6) * .23;
    position.setXYZ(i, x * swell, y * swell, z * swell);
  }
  leavesGeometry.computeVertexNormals();
  const leavesMaterial = new THREE.MeshStandardMaterial({ roughness: 1 });
  const trunkGeometry = new THREE.CylinderGeometry(.38, .65, 1, 5);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#5e5840', roughness: 1 });
  const dummy = new THREE.Object3D();
  function groupFor(trees: Tree[]) {
    const group = new THREE.Group();
    const leaves = new THREE.InstancedMesh(leavesGeometry, leavesMaterial, trees.length * 3);
    const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, trees.length);
    trees.forEach((tree, i) => {
      const h = elevationAt(tree.x, tree.y), r = tree.radius;
      dummy.position.set(tree.x, h + tree.height * .4, tree.y);
      dummy.rotation.set(0, 0, 0); dummy.scale.set(1, tree.height * .8, 1); dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix);
      const base = new THREE.Color(tree.evil ? '#29483c' : '#60754a');
      base.offsetHSL((tree.seed - .5) * .05, -.03, (tree.seed - .5) * .10);
      for (let lobe = 0; lobe < 3; lobe++) {
        const angle = lobe * 2.399 + tree.seed * 8;
        dummy.position.set(tree.x + Math.cos(angle) * r * .4, h + tree.height * (.58 + lobe * .11), tree.y + Math.sin(angle) * r * .4);
        dummy.rotation.set(tree.seed * .3, angle, .1);
        dummy.scale.set(r * (1 - lobe * .12), r * (tree.evil ? 1.3 : 1.05), r * .85);
        dummy.updateMatrix(); leaves.setMatrixAt(i * 3 + lobe, dummy.matrix);
        leaves.setColorAt(i * 3 + lobe, base.clone().multiplyScalar(.89 + lobe * .065));
      }
    });
    leaves.castShadow = true; leaves.receiveShadow = true; trunks.castShadow = true;
    leaves.computeBoundingSphere(); trunks.computeBoundingSphere();
    group.add(trunks, leaves);
    return group;
  }
  return { permanent: groupFor(permanent), restored: groupFor(restored) };
}

function rockMesh() {
  const rocks: { x: number; y: number; radius: number; tall: number }[] = [];
  for (let y = 80; y < 1450; y += 15) for (let x = 460; x < 1850; x += 15) {
    const px = x + hash(x, y) * 13, py = y + hash(x + 3, y) * 13;
    const sample = terrainSample(px, py), cliff = Math.abs(py - scarpLine(px));
    if (sample.local > .05) continue;
    if (sample.forest > .5 || sample.distance < sample.river.width * .92) continue;
    if (hash(x + 31, y) > (cliff < 38 ? .92 : sample.bank * .4 + .07)) continue;
    const radius = 1.8 + hash(x, y + 18) * (cliff < 38 ? 6 : 3.8);
    rocks.push({ x: px, y: py, radius, tall: cliff < 27 ? 2.5 : .7 });
  }
  const geometry = new THREE.IcosahedronGeometry(1, 0);
  const material = new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true });
  const mesh = new THREE.InstancedMesh(geometry, material, rocks.length);
  const dummy = new THREE.Object3D();
  rocks.forEach((rock, i) => {
    dummy.position.set(rock.x, elevationAt(rock.x, rock.y) + rock.radius * .2, rock.y);
    dummy.rotation.set(hash(i, 2) * .6, hash(i, 3) * 6, hash(i, 5) * .4);
    dummy.scale.set(rock.radius, rock.radius * rock.tall, rock.radius * .85); dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, new THREE.Color('#96917f').multiplyScalar(.7 + hash(i, 7) * .35));
  });
  mesh.castShadow = true; mesh.receiveShadow = true; mesh.computeBoundingSphere();
  return mesh;
}

function buildings() {
  const group = new THREE.Group();
  const plaster = new THREE.MeshStandardMaterial({ color: '#e0ceb0', roughness: 1 });
  const roof = new THREE.MeshStandardMaterial({ color: '#716653', roughness: 1 });
  function cottage(x: number, y: number, scale = 1) {
    const h = elevationAt(x, y);
    const body = new THREE.Mesh(new THREE.BoxGeometry(10 * scale, 7 * scale, 8 * scale), plaster);
    body.position.set(x, h + 3.5 * scale, y); body.castShadow = true; body.receiveShadow = true;
    const top = new THREE.Mesh(new THREE.ConeGeometry(8 * scale, 5 * scale, 4), roof);
    top.position.set(x, h + 8.4 * scale, y); top.rotation.y = Math.PI / 4; top.scale.z = .8; top.castShadow = true;
    group.add(body, top);
  }
  cottage(840, 790); cottage(180, 1180, 1.25);
  for (let i = 0; i < 48; i++) {
    const angle = i * 2.399, radius = 15 + Math.sqrt(i / 48) * 67;
    cottage(2030 + Math.cos(angle) * radius, 1060 + Math.sin(angle) * radius * .65, .7 + hash(i, 8) * .45);
  }
  cottage(2040, 1003, 2.5);
  return group;
}

export function createTerrainWorld(canvas: HTMLCanvasElement, initial: Landscape) {
  // Each mounted renderer owns its uniforms and GPU resources.
  const blend = { ...water, value: initial === 'restored' ? 1 : 0 }, time = { value: 0 }, viewport = { value: 1000 };
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#dad1b9');
  scene.add(new THREE.HemisphereLight('#f5ecd6', '#59694e', 1.75));
  const sun = new THREE.DirectionalLight('#fff1d5', 2.6);
  sun.position.set(400, 1300, 100); sun.target.position.set(1100, 0, 800);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -1700, right: 1700, top: 1400, bottom: -1400, near: 100, far: 3500 });
  sun.shadow.bias = -.00035; sun.shadow.normalBias = 1.2; sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  const assets = naturalMaterials(), details = createCataractDetails(assets);
  const ground = groundMesh(blend), forest = forestMeshes();
  scene.add(ground, ...createWaterways(blend, time, viewport), forest.permanent, forest.restored, rockMesh(), details.permanent, details.restored, buildings());
  const camera = new THREE.OrthographicCamera(-500, 500, 500, -500, 1, 6500);
  const flyCamera = new THREE.PerspectiveCamera(flyFov, 1, .5, 12000);
  let previousSize: Size = { width: 0, height: 0 }, target = blend.value;
  return {
    render(view: Camera, size: Size, landscape: Landscape, elapsed: number, delta: number, reducedMotion: boolean, scaleReference = false) {
      if (previousSize.width !== size.width || previousSize.height !== size.height) {
        renderer.setSize(size.width, size.height, false); previousSize = size;
      }
      target = landscape === 'restored' ? 1 : 0;
      blend.value = reducedMotion ? target : THREE.MathUtils.damp(blend.value, target, 5, delta);
      forest.restored.visible = blend.value > .45;
      details.restored.visible = blend.value > .45;
      details.reference.visible = scaleReference;
      viewport.value = size.height * renderer.getPixelRatio();
      time.value = reducedMotion ? 0 : elapsed;
      const scale = scaleFor(view, size), halfWidth = size.width / scale / 2, halfHeight = size.height / scale / 2;
      camera.left = -halfWidth; camera.right = halfWidth; camera.top = halfHeight; camera.bottom = -halfHeight;
      const active = view.fly ? flyCamera : camera;
      flyCamera.aspect = size.width / size.height;
      const pose = cameraPose(view);
      active.position.set(...pose.position); active.up.set(...pose.up); active.lookAt(...pose.target);
      active.updateProjectionMatrix(); active.updateMatrixWorld();
      renderer.render(scene, active);
    },
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
      scene.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          geometries.add(object.geometry);
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
          if (object instanceof THREE.InstancedMesh) object.dispose();
        }
      });
      const textures = new Set<THREE.Texture>();
      materials.forEach(material => { for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value); });
      textures.forEach(texture => texture.dispose());
      geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose());
      sun.shadow.dispose(); renderer.dispose();
    },
  };
}
