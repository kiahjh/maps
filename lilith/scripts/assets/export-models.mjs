import fs from 'node:fs/promises';
import { boulderGeometry, grassGeometry, shrubGeometry, wildflowerGeometry, treeGeometry, scaleFigureGeometry } from '../../src/lib/assets/natural-models.ts';

const wood = { name: 'Bark', pbrMetallicRoughness: { baseColorFactor: [.24,.19,.12,1], metallicFactor: 0, roughnessFactor: .96 } };
const foliage = { name: 'Leaf colour', doubleSided: true, pbrMetallicRoughness: { metallicFactor: 0, roughnessFactor: .84 } };
const stone = { name: 'Weathered stone', pbrMetallicRoughness: { baseColorFactor: [.366,.342,.246,1], metallicFactor: 0, roughnessFactor: .95 } };
async function save(name, geometries, materials) {
  const chunks = [], bufferViews = [], accessors = [], primitives = [];
  let offset = 0;
  const accessor = (attribute, type, bounds = false) => {
    const array = attribute.array, raw = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
    const padding = (4 - raw.length % 4) % 4;
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: raw.length }); chunks.push(raw, Buffer.alloc(padding)); offset += raw.length + padding;
    const entry = { bufferView: bufferViews.length - 1, componentType: array instanceof Float32Array ? 5126 : array instanceof Uint32Array ? 5125 : 5123, count: attribute.count, type };
    if (bounds) {
      entry.min = [Infinity,Infinity,Infinity]; entry.max = [-Infinity,-Infinity,-Infinity];
      for (let i = 0; i < array.length; i++) { const axis = i % 3; entry.min[axis] = Math.min(entry.min[axis], array[i]); entry.max[axis] = Math.max(entry.max[axis], array[i]); }
    }
    accessors.push(entry); return accessors.length - 1;
  };
  geometries.forEach((geometry, index) => {
    const attributes = {};
    for (const [key, semantic, type] of [['position','POSITION','VEC3'],['normal','NORMAL','VEC3'],['uv','TEXCOORD_0','VEC2'],['color','COLOR_0','VEC3']]) {
      const attribute = geometry.getAttribute(key); if (attribute) attributes[semantic] = accessor(attribute, type, key === 'position');
    }
    const primitive = { attributes, material: index, mode: 4 };
    if (geometry.index) primitive.indices = accessor(geometry.index, 'SCALAR'); primitives.push(primitive);
  });
  const document = { asset: { version: '2.0', generator: 'Lilith project-authored natural asset library', extras: { units: 'metres' } }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0, name }], meshes: [{ name, primitives }], materials, buffers: [{ byteLength: offset, uri: 'data:application/octet-stream;base64,' + Buffer.concat(chunks).toString('base64') }], bufferViews, accessors };
  await fs.writeFile(`public/assets/models/${name}.gltf`, JSON.stringify(document)); geometries.forEach(geometry => geometry.dispose());
}
await fs.mkdir('public/assets/models', { recursive: true });
await save('river-boulder', [boulderGeometry(2)], [stone]);
await save('rock-slab', [boulderGeometry(7, true)], [stone]);
await save('grass-clump', [grassGeometry(4)], [foliage]);
const shrub = shrubGeometry(3); await save('flowering-shrub', [shrub.wood, shrub.leaves, shrub.flowers], [wood, foliage, foliage]);
const flowers = wildflowerGeometry(1); await save('wildflower-clump', [flowers.stems, flowers.flowers], [foliage, foliage]);
const tree = treeGeometry(4); await save('broadleaf-tree', [tree.wood, tree.leaves], [wood, foliage]);
await save('scale-reference-1.8m', [scaleFigureGeometry()], [wood]);
console.log('Exported seven reusable glTF models in metres.');
