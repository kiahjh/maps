import * as THREE from 'three';

export function naturalMaterials() {
  // A shared, project-authored palette. No downloaded models or texture maps.
  return {
    stone: new THREE.MeshStandardMaterial({ color: '#a39e88', roughness: .95 }),
    mossStone: new THREE.MeshStandardMaterial({ color: '#829075', roughness: .95 }),
    wood: new THREE.MeshStandardMaterial({ color: '#665641', roughness: .96 }),
    foliage: new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: .84 }),
    flowers: new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: .95 }),
  };
}
export type NaturalMaterials = ReturnType<typeof naturalMaterials>;
