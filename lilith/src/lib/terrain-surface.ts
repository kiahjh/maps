import type { MeshStandardMaterial } from 'three';

// Restrained, continuous colour and relief keep the existing sculpted landform
// readable at map scale. Everything is generated in world space, without images.
export function applyTerrainSurface(material: MeshStandardMaterial, blend: { value: number }) {
  material.onBeforeCompile = shader => {
    shader.uniforms.uWater = blend;
    shader.vertexShader = `uniform float uWater; attribute vec3 wetColor; attribute float sandFill; varying vec3 vLand; varying vec3 vSurface; attribute vec3 surface;\n${shader.vertexShader}`
      .replace('#include <color_vertex>', 'vColor = vec4(mix(color, wetColor, uWater), 1.0); vSurface = surface;')
      .replace('#include <begin_vertex>', 'vec3 transformed = vec3(position); transformed.y += sandFill * (1.0 - uWater); vLand = transformed;');
    shader.fragmentShader = `
      varying vec3 vLand; varying vec3 vSurface;
      float landHash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float landNoise(vec3 p) {
        vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(mix(landHash(i),landHash(i+vec3(1,0,0)),f.x),
          mix(landHash(i+vec3(0,1,0)),landHash(i+vec3(1,1,0)),f.x),f.y),
          mix(mix(landHash(i+vec3(0,0,1)),landHash(i+vec3(1,0,1)),f.x),
          mix(landHash(i+vec3(0,1,1)),landHash(i+vec3(1,1,1)),f.x),f.y),f.z);
      }
      float stoneRelief(vec3 p) {
        float coarse=landNoise(p*.19);
        float seam=pow(.5+.5*sin(p.y*.92+coarse*2.8+sin(p.x*.047)),8.0);
        float joint=1.0-smoothstep(.025,.11,abs(landNoise(p*vec3(.32,.12,.32))-.51));
        return coarse*.20+landNoise(p*.63)*.045+landNoise(p*2.7)*.014-seam*.075-joint*.04;
      }
      ${shader.fragmentShader}`
      .replace('#include <color_fragment>', `
        #include <color_fragment>
        float coarse=landNoise(vLand*.075), grain=landNoise(vLand*1.1);
        float weather=landNoise(vLand*.38)*.65+landNoise(vLand*1.4)*.35;
        float joint=1.0-smoothstep(.025,.10,abs(landNoise(vLand*vec3(.32,.12,.32))-.51));
        float strata=sin(vLand.y*.53+sin(vLand.x*.056)*1.8+coarse*1.2);
        diffuseColor.rgb*=.96+grain*.055+strata*.023*vSurface.y;
        vec3 stone=mix(vec3(.27,.28,.25),vec3(.39,.395,.335),weather);
        stone*=.78+coarse*.38+strata*.06-joint*.12;
        diffuseColor.rgb=mix(diffuseColor.rgb,stone,vSurface.x*vSurface.y*.82);
        vec3 moss=vec3(.17,.235,.095)*(.90+coarse*.18);
        diffuseColor.rgb=mix(diffuseColor.rgb,moss,vSurface.z*.72);
      `)
      .replace('#include <normal_fragment_begin>', `
        #include <normal_fragment_begin>
        float relief=stoneRelief(vLand)*vSurface.x*(.15+vSurface.y*.85);
        vec3 p=-vViewPosition, sx=dFdx(p), sy=dFdy(p);
        vec3 r1=cross(sy,normal), r2=cross(normal,sx);
        float det=dot(sx,r1);
        vec3 gradient=sign(det)*(dFdx(relief)*r1+dFdy(relief)*r2);
        normal=normalize(max(abs(det),.00000001)*normal-gradient);
      `);
  };
}
