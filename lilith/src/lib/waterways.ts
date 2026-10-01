import * as THREE from 'three';
import { cataractZone, elevationAt, rivers, riverWidthAt } from './landscape';
import type { River } from './landscape';
import { cataract, cataractWaterLevel, sampleByY } from './cataract';
import { smooth, noise, hash } from './terrain-math';
import { streamBoulders } from './cataract-habitat';

export function waterLevel(x: number, y: number, river: River, centerHeight?: number) {
  const local = river.alwaysWet ? 0 : cataractZone(x, y);
  const ground = centerHeight ?? elevationAt(x, y);
  const depth = y < cataract.lip ? 3.5 : 2.4;
  return ground + 3.1 * (1 - local) + depth * local;
}
export function waterGeometry(river: River) {
  const points = river.points.flatMap((a, i) => {
    const b = river.points[i + 1]; if (!b) return [a];
    const resolution = cataractZone(a.x, a.y) > .7 ? .55 : 2.5;
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / resolution));
    return Array.from({length:steps}, (_, j) => ({x:a.x+(b.x-a.x)*j/steps,y:a.y+(b.y-a.y)*j/steps}));
  });
  const positions: number[] = [], uv: number[] = [], fall: number[] = [], indices: number[] = [], local: number[] = [];
  const crossSteps = 10;
  let distance = 0, previous = new THREE.Vector3();
  points.forEach((point, i) => {
    const a = points[Math.max(0,i-1)], b = points[Math.min(points.length-1,i+1)], length = Math.max(.001, Math.hypot(b.x-a.x,b.y-a.y));
    const nx = -(b.y-a.y)/length, ny = (b.x-a.x)/length, height = waterLevel(point.x,point.y,river);
    const slope = Math.abs(waterLevel(a.x,a.y,river)-waterLevel(b.x,b.y,river))/length;
    const drop = smooth(.5,2.8,slope), patch = cataractZone(point.x,point.y);
    const center = new THREE.Vector3(point.x,height,point.y);
    if(i) distance += center.distanceTo(previous); previous.copy(center);
    const width = riverWidthAt(river,point.y) * (.93 + noise(point.x/11,point.y/9)*.10);
    for(let j=0;j<=crossSteps;j++) {
      const t=j/crossSteps, side=t*2-1;
      let x=point.x+nx*width*side, y=point.y+ny*width*side;
      // At the fork the two inner edges share a boundary instead of drawing
      // two overlapping river ribbons. Their mouths still meet the upstream.
      if ((river.id==='first'||river.id==='second') && y<635 && y>=587) {
        const west=sampleByY(rivers[1].points,y), east=sampleByY(rivers[2].points,y), middle=(west.x+east.x)/2;
        x=river.id==='first'?Math.min(x,middle):Math.max(x,middle);
      }
      const level=waterLevel(x,y,river,elevationAt(point.x,point.y));
      const h=patch>.99 ? Math.max(level,elevationAt(x,y)+.12) : level;
      positions.push(x,h,y); uv.push(t,distance); fall.push(drop); local.push(patch);
      if(i<points.length-1&&j<crossSteps){ const k=i*(crossSteps+1)+j;indices.push(k,k+1,k+crossSteps+1,k+1,k+crossSteps+2,k+crossSteps+1); }
    }
  });
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3)); geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.setAttribute('fall',new THREE.Float32BufferAttribute(fall,1)); geometry.setAttribute('local',new THREE.Float32BufferAttribute(local,1));
  geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}
const waterNoise=`
float random(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float waterNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(random(i),random(i+vec2(1,0)),f.x),mix(random(i+vec2(0,1)),random(i+1.0),f.x),f.y);}
float turbulence(vec2 p){return waterNoise(p)*.57+waterNoise(p*2.03+7.0)*.28+waterNoise(p*4.1)*.15;}
`;
function waterMaterial(blend: {value:number}, time: {value:number}) {
  return new THREE.ShaderMaterial({ uniforms:{uWater:blend,uTime:time,
    uStones:{value:streamBoulders.map(p=>new THREE.Vector3(p.x,p.y,p.foamRadius))},
    uCurrents:{value:streamBoulders.map(p=>new THREE.Vector2(p.current.x,p.current.y))}}, vertexShader:`
    uniform float uTime; attribute float fall; attribute float local; varying vec3 vNative; varying float vLocal; varying vec2 vUv; varying float vFall; varying vec3 vNormal; varying vec3 vView;
    void main(){vUv=uv;vFall=fall*(1.0-local);vNative=position;vLocal=local;vec3 p=position;
      p.y+=sin(position.x*.8+position.z*.6-uTime*1.6)*.035*(1.0-fall);
      p.z+=sin(uv.x*29.0+uv.y*1.8-uTime*6.0)*.045*fall;
      vec4 view=modelViewMatrix*vec4(p,1.0);vView=-view.xyz;vNormal=normalize(normalMatrix*normal);
      gl_Position=projectionMatrix*view;
    }`,fragmentShader:`uniform float uWater;uniform float uTime;uniform vec3 uStones[${streamBoulders.length}];uniform vec2 uCurrents[${streamBoulders.length}];varying vec3 vNative; varying float vLocal;varying vec2 vUv;varying float vFall;varying vec3 vNormal;varying vec3 vView;
    ${waterNoise}
    void main(){if(uWater<.002||(vLocal>.99 && vNative.z>=592.0 && vNative.z<=600.0))discard;
      float edge=abs(vUv.x*2.0-1.0), velocity=mix(.32,8.0,vFall);
      vec2 flow=vec2(vUv.x*29.0,vUv.y*.45-uTime*velocity);
      float broad=turbulence(flow*.35), streak=turbulence(flow*vec2(1.4,.38));
      float froth=smoothstep(.42,.77,streak)*(.35+broad*.65);
      float fresnel=pow(1.0-abs(dot(normalize(vNormal),normalize(vView))),3.0);
      vec3 deep=vec3(.065,.235,.245), shallow=vec3(.12,.315,.31), white=vec3(.80,.91,.88);
      vec3 color=mix(deep,shallow,.30+broad*.25+pow(edge,4.0)*.26);
      float ripples=smoothstep(.84,.96,turbulence(flow*vec2(.45,1.8)))*.075;
      float rapids=vLocal*smoothstep(599.0,604.0,vNative.z)*(1.0-smoothstep(610.0,644.0,vNative.z));
      float broken=smoothstep(.55,.78,turbulence(flow*vec2(.7,.9)))*rapids*.36;
      color=mix(color,white,fresnel*.12+vFall*(.55+froth*.34)+ripples+broken);
      float stoneFoam=0.0;
      if(vLocal>.99&&vNative.z>600.0)for(int i=0;i<${streamBoulders.length};i++) {
        vec2 delta=vNative.xz-uStones[i].xy,current=uCurrents[i];float r=uStones[i].z;
        float along=dot(delta,current),across=abs(dot(delta,vec2(current.y,-current.x)));
        float bow=(1.0-smoothstep(.20,.85,abs(length(delta)-r)))*(1.0-smoothstep(0.0,r,along));
        float wakeWidth=r*.78+max(0.0,along)*.15;
        float wake=(1.0-smoothstep(.18,.90,abs(across-wakeWidth)))
          *smoothstep(0.0,r*.65,along)*(1.0-smoothstep(r*1.5,r*4.3,along));
        float flecks=smoothstep(.38,.72,turbulence(vec2(across*1.8,along*1.15-uTime*1.6)));
        stoneFoam=max(stoneFoam,(bow*.7+wake*.48)*(.3+flecks*.7));
      }
      color=mix(color,white,stoneFoam*.72);
      float border=1.0-smoothstep(.88,1.0,edge);
      float alpha=uWater*border*mix(1.0,.94+froth*.06,vFall);
      gl_FragColor=vec4(color,alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,transparent:true,depthWrite:false,side:THREE.DoubleSide });
}
// Broad, connected folds keep the cataract legible as water at map scale.
// They share their lip and foot with the river, rather than forming separate jets.
function fallingStreams(blend:{value:number}, time:{value:number}) {
  const positions:number[]=[], uv:number[]=[], indices:number[]=[];
  const crossSteps=64, steps=90;
  for(const river of rivers.slice(1,3)) {
    const start=positions.length/3;
    for(let i=0;i<=steps;i++) {
      const t=i/steps, y=cataract.lip+(cataract.foot-cataract.lip)*t;
      const center=sampleByY(river.points,y),west=sampleByY(rivers[1].points,y),east=sampleByY(rivers[2].points,y),mid=(west.x+east.x)/2;
      const width=riverWidthAt(river,y)*.95;
      const left=river.id==='first'?center.x-width:mid,right=river.id==='first'?mid:center.x+width;
      for(let j=0;j<=crossSteps;j++) {
        const cross=j/crossSteps,x=left+(right-left)*cross;
        const fold=(Math.sin(x*.48+t*5.2)*.48+Math.sin(x*.17-t*6.8)*.28)*Math.sin(t*Math.PI);
        positions.push(x,cataract.upperWater-cataract.drop*t*t,y+fold);
        uv.push(x*.08,t);
        if(i<steps&&j<crossSteps){const k=start+i*(crossSteps+1)+j;indices.push(k,k+1,k+crossSteps+1,k+1,k+crossSteps+2,k+crossSteps+1);}
      }
    }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  const material=new THREE.ShaderMaterial({uniforms:{uWater:blend,uTime:time},vertexShader:`
    uniform float uTime;varying vec2 vUv;varying vec3 vPosition;varying vec3 vView;
    ${waterNoise}
    void main(){vUv=uv;vec3 p=position;
      float n=turbulence(vec2(position.x*.38,uv.y*12.0-uTime*2.4));
      float envelope=sin(uv.y*3.14159);
      p.z+=(n-.5)*.65*envelope;
      p.x+=sin(uv.y*15.0-uTime*3.0+position.x*.4)*.07*envelope;
      vec4 view=modelViewMatrix*vec4(p,1.0);vView=-view.xyz;vPosition=view.xyz;
      gl_Position=projectionMatrix*view;
    }`,fragmentShader:`uniform float uWater;uniform float uTime;varying vec2 vUv;varying vec3 vPosition;varying vec3 vView;
    ${waterNoise}
    void main(){if(uWater<.002)discard;
      float broad=turbulence(vec2(vUv.x*2.0,vUv.y*10.0-uTime*2.6));
      float fine=turbulence(vec2(vUv.x*7.0,vUv.y*37.0-uTime*8.0));
      float foam=smoothstep(.34,.72,broad*.73+fine*.27);
      float air=smoothstep(.015,.34,vUv.y);
      vec3 normal=normalize(cross(dFdx(vPosition),dFdy(vPosition)));
      float fresnel=pow(1.0-abs(dot(normal,normalize(vView))),3.0);
      vec3 color=mix(vec3(.095,.275,.285),vec3(.80,.91,.88),air*(.56+foam*.35));
      color=mix(color,vec3(.86,.95,.93),fresnel*.12);
      color*=.91+abs(normal.y)*.05+abs(normal.z)*.05;
      gl_FragColor=vec4(color,uWater*(.90+foam*.08));
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,transparent:true,depthWrite:false,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(geometry,material);mesh.renderOrder=3;return mesh;
}
function impactFoam(x:number,y:number, radius:number, blend:{value:number},time:{value:number}) {
  const geometry=new THREE.PlaneGeometry(radius*2,radius*2,1,1);geometry.rotateX(-Math.PI/2);
  const material=new THREE.ShaderMaterial({uniforms:{uWater:blend,uTime:time},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`uniform float uWater;uniform float uTime;varying vec2 vUv;${waterNoise}
    void main(){vec2 p=vUv*2.0-1.0;float d=length(p);float n=turbulence(p*9.0-uTime*.55);
      float foam=smoothstep(.31,.70,n)*(1.0-smoothstep(.18,.98,d));
      gl_FragColor=vec4(vec3(.82,.93,.90),foam*.66*uWater);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,transparent:true,depthWrite:false,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,cataractWaterLevel(x,y)+.22,y);mesh.renderOrder=3;return mesh;
}
function spray(blend:{value:number},time:{value:number}, viewport:{value:number}) {
  const positions:number[]=[], seeds:number[]=[];
  for(const river of rivers.slice(1,3)) {
    const base=sampleByY(river.points,cataract.foot+3);
    for(let i=0;i<480;i++){positions.push(base.x+(hash(i,river.width)-.5)*river.width*2,cataract.lowerWater+hash(i,4)*4.5,base.y+hash(i,8)*6);seeds.push(hash(i,6));}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('seed',new THREE.Float32BufferAttribute(seeds,1));
  const material=new THREE.ShaderMaterial({uniforms:{uWater:blend,uTime:time,uViewport:viewport},vertexShader:`uniform float uTime;uniform float uViewport;attribute float seed;varying float vLife;
    void main(){float life=fract(uTime*.35+seed);vLife=sin(life*3.14159);vec3 p=position+vec3(life*.8,life*4.0,life*2.0);
      vec4 view=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*view;gl_PointSize=clamp((.24+seed*.85)*projectionMatrix[1][1]*uViewport/gl_Position.w,1.0,110.0);}`,fragmentShader:`uniform float uWater;varying float vLife;void main(){float d=length(gl_PointCoord-.5)*2.0;float alpha=pow(max(0.0,1.0-d*d),3.0)*.09*vLife*uWater;gl_FragColor=vec4(.82,.89,.85,alpha);}`,transparent:true,depthWrite:false});
  const points=new THREE.Points(geometry,material);points.renderOrder=4;return points;
}
export function createWaterways(blend:{value:number},time:{value:number},viewport:{value:number}) {
  const meshes:THREE.Object3D[]=rivers.map(river=>{const mesh=new THREE.Mesh(waterGeometry(river),waterMaterial(river.alwaysWet?{value:1}:blend,time));mesh.renderOrder=2;return mesh;});
  for(const river of rivers.slice(1,3)){const point=sampleByY(river.points,cataract.foot+5);meshes.push(impactFoam(point.x,point.y,river.width*.8,blend,time));}
  meshes.push(fallingStreams(blend,time),spray(blend,time,viewport));return meshes;
}
