import * as THREE from 'three';
import { cataractZone, elevationAt, nearestRiver, terrainSample } from './landscape';
import { ascentAt } from './cataract';
import { streamBoulders } from './cataract-habitat';
import { hash, noise } from './terrain-math';
import { boulderGeometry, grassGeometry, shrubGeometry, wildflowerGeometry, treeGeometry, scaleFigureGeometry } from './assets/natural-models';
import type { NaturalMaterials } from './assets/materials';

type Placement = {x:number;y:number;scale:number;seed:number;rootLift?:number;leanX?:number;leanZ?:number};
const dummy=new THREE.Object3D();
function instances(geometry:THREE.BufferGeometry,material:THREE.Material,places:Placement[], embed=.08) {
  const mesh=new THREE.InstancedMesh(geometry,material,places.length);
  places.forEach((p,i)=>{dummy.position.set(p.x,elevationAt(p.x,p.y)+(p.rootLift??-embed*p.scale),p.y);dummy.rotation.set(p.leanX??0,p.seed*6.283,p.leanZ??0);dummy.scale.setScalar(p.scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    mesh.setColorAt(i,new THREE.Color().setRGB(.88+p.seed*.16,.90+p.seed*.13,.85+p.seed*.17));
  });
  mesh.receiveShadow=true;mesh.computeBoundingSphere();return mesh;
}
export function createCataractDetails(materials:NaturalMaterials) {
  const permanent=new THREE.Group(),restored=new THREE.Group();
  const stonePlaces:Placement[]=[...streamBoulders],mossPlaces:Placement[]=[],grassPlaces:Placement[]=[],shrubPlaces:Placement[]=[],flowerPlaces:Placement[]=[],treePlaces:Placement[]=[];
  for(let y=518;y<765;y+=2.5)for(let x=740;x<1130;x+=2.5) {
    const seed=hash(x,y),px=x+seed*2.5,py=y+hash(x+9,y)*2.5,patch=cataractZone(px,py);
    if(patch<.95)continue;
    const nearest=nearestRiver(px,py),d=nearest.distance,w=nearest.halfWidth,route=ascentAt(px,py).distance;
    const height=elevationAt(px,py),slope=Math.hypot(elevationAt(px+1,py)-height,elevationAt(px,py+1)-height);
    if(d<w+1.5||route<1.3)continue;
    const foot=Math.exp(-(((py-623)/27)**2)),bank=Math.exp(-(((d-w-6)/9)**2));
    const cluster = noise(px/19,py/23);
    if(slope<.8&&seed<(foot*.18+bank*.2)*patch*(.1+cluster**3*2.6)&&route>3) {
      const r=.22+hash(x,y+8)**3*(foot>.7?3.2:1.65);
      const p={x:px,y:py,scale:r,seed};
      (bank>.45&&py>597?mossPlaces:stonePlaces).push(p);
    }
    if(slope<.45&&seed<(.65+bank*.65)*noise(px/11,py/13)&&route>2)
      grassPlaces.push({x:px,y:py,scale:.7+seed*.8,seed});
    if(slope<.38&&d>w+3.5&&route>3.5&&hash(x+67,y)<.24*noise(px/22,py/18)**2*(.45+bank*1.4)) {
      shrubPlaces.push({x:px,y:py,scale:.8+hash(x+43,y)**2,seed});
      // Smaller companions make thickets, with open ground between patches.
      if(bank>.18||foot>.5)for(let n=0;n<3;n++) {
        const angle=hash(x+n+31,y)*Math.PI*2,r=1.5+hash(x+n,y+41)*2.6;
        const sx=px+Math.cos(angle)*r,sy=py+Math.sin(angle)*r,sh=elevationAt(sx,sy),channel=nearestRiver(sx,sy);
        const grade=Math.hypot(elevationAt(sx+1,sy)-sh,elevationAt(sx,sy+1)-sh);
        if(grade<.65&&channel.distance>channel.halfWidth+2.5&&ascentAt(sx,sy).distance>3)
          shrubPlaces.push({x:sx,y:sy,scale:.55+hash(x+n,y+73)*.65,seed:hash(sx,sy)});
      }
    }
    if(slope<.7&&bank>.15&&noise(px/8,py/9)>.52&&hash(x+137,y)<.28&&route>1.8)
      for(let n=0;n<3;n++) {
        const angle=hash(x+n,y+55)*Math.PI*2,r=hash(x+n,y+17)*1.2;
        const fx=px+Math.cos(angle)*r,fy=py+Math.sin(angle)*r,channel=nearestRiver(fx,fy);
        if(channel.distance>channel.halfWidth+2&&ascentAt(fx,fy).distance>1.8)
          flowerPlaces.push({x:fx,y:fy,scale:.8+hash(x+n,y+66)*.6,seed:hash(fx,fy)});
      }
    if(slope<.32&&d>w+14&&route>8&&hash(x+113,y)<.12*Math.max(0,(noise(px/29,py/25)-.45))*2&&py<582)
      treePlaces.push({x:px,y:py,scale:.75+seed*.3,seed});
  }
  const cliffShrubs:Placement[]=[];
  // Root only on actual rock shelves. Steep bare faces stay exposed, and the
  // climb remains clear. A finer scatter finds pockets missed by the bank grid.
  for(let y=574;y<641;y+=1.6)for(let x=770;x<1030;x+=1.6) {
    const seed=hash(x+211,y),px=x+seed*1.6,py=y+hash(x,y+91)*1.6;
    const sample=terrainSample(px,py),nearest=nearestRiver(px,py),route=ascentAt(px,py).distance;
    if(sample.local<.99||sample.cliff<.45||sample.height<43||sample.height>72||nearest.distance<nearest.halfWidth+4||route<5)continue;
    const dx=elevationAt(px+.65,py)-elevationAt(px-.65,py),dy=elevationAt(px,py+.65)-elevationAt(px,py-.65);
    const grade=Math.hypot(dx,dy)/1.3;
    if(grade>.95||seed>.34*noise(px/9,py/7)**2)continue;
    cliffShrubs.push({x:px,y:py,scale:.55+hash(x+47,y)*.70,seed,leanX:Math.max(-.18,Math.min(.18,-dy*.10)),leanZ:Math.max(-.18,Math.min(.18,dx*.10))});
    if(hash(x+7,y)>.35)flowerPlaces.push({x:px,y:py,scale:.75+seed,seed});
  }
  shrubPlaces.push(...cliffShrubs);
  for(let variant=0;variant<3;variant++) {
    const rock=boulderGeometry(variant+2);
    const dry=instances(rock,materials.stone,stonePlaces.filter((_,i)=>i%3===variant),.05);
    const damp=instances(rock,materials.mossStone,mossPlaces.filter((_,i)=>i%3===variant),.05);
    dry.castShadow=damp.castShadow=true;permanent.add(dry,damp);
    const grass=instances(grassGeometry(variant+1),materials.foliage,grassPlaces.filter((_,i)=>i%3===variant),0);restored.add(grass);
    const shrub=shrubGeometry(variant+3),shrubs=shrubPlaces.filter((_,i)=>i%3===variant);
    const branches=instances(shrub.wood,materials.wood,shrubs,0),shrubLeaves=instances(shrub.leaves,materials.foliage,shrubs,0);
    branches.castShadow=shrubLeaves.castShadow=true;
    restored.add(branches,shrubLeaves,instances(shrub.flowers,materials.flowers,shrubs,0));
    const flowers=wildflowerGeometry(variant+1),patches=flowerPlaces.filter((_,i)=>i%3===variant);
    restored.add(instances(flowers.stems,materials.foliage,patches,.035),instances(flowers.flowers,materials.flowers,patches,.035));
    const tree=treeGeometry(variant+4),trees=treePlaces.filter((_,i)=>i%3===variant);
    const trunks=instances(tree.wood,materials.wood,trees,0),leaves=instances(tree.leaves,materials.foliage,trees,0);
    trunks.castShadow=leaves.castShadow=true;restored.add(trunks,leaves);
  }
  // A neutral 1.8 m inspection reference, not a portrayal of a book character.
  const reference=new THREE.Mesh(scaleFigureGeometry(),new THREE.MeshStandardMaterial({color:'#a75a3b',roughness:.9}));
  reference.position.set(1049,elevationAt(1049,605),605);reference.castShadow=true;reference.visible=false;permanent.add(reference);
  return {permanent,restored,reference,counts:{stones:stonePlaces.length+mossPlaces.length,streamBoulders:streamBoulders.length,grass:grassPlaces.length,shrubs:shrubPlaces.length,cliffShrubs:cliffShrubs.length,flowers:flowerPlaces.length,trees:treePlaces.length}};
}
