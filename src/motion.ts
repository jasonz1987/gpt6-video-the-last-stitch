import * as THREE from 'three';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const WIDTH = 6.8047337278;
export const HEIGHT = 5;
export const BIG = {x: -WIDTH/3, z:-1.25, r:.75};
export const SEAM = BIG.z-.385;
export const HOLE = {x:BIG.x+.025, z:SEAM};
export const clamp = (v:number)=>Math.max(0,Math.min(1,v));
export const smooth = (t:number,a:number,b:number)=>{const p=clamp((t-a)/(b-a));return p*p*(3-2*p);};
export const ease = (t:number,a:number,b:number)=>{const p=clamp((t-a)/(b-a));return p*p*p*(p*(p*6-15)+10);};
export const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
export const gap=(t:number)=>.022*(1-ease(t,6.25,8.3));

export function clothY(x:number,z:number,t:number) {
  const overhang=Math.max(0,-1.39-z);
  const distance=Math.hypot(x-HOLE.x,z-SEAM);
  const calm=1-Math.exp(-distance*distance/ .045);
  const folds=.026*(1+Math.sin(x*3.4+z*2.2))+.013*(1+Math.sin(z*6.4-x*.7))+.006*Math.sin(z*10.3+x*.3)**2;
  const air=ease(t,10.2,15)*(.016*(1+Math.sin(z*4.3+x*1.8-t*1.25))+.011*(1+Math.sin(x*4.4+t*1.7)))*calm;
  const held=.14*Math.exp(-distance*distance/.11)*(1-ease(t,8.3,12.7));
  return -.012-.13*overhang*overhang+folds+air+held;
}

export function needleState(t:number) {
  const down=ease(t,.55,2.8);
  const turn=ease(t,2.85,3.45);
  const up=ease(t,3.45,5.45);
  const away=ease(t,5.6,6.9);
  const x=HOLE.x+mix(-.01,.026,turn)+away*.27;
  const z=SEAM+mix(.012,-.012,turn)-away*.08;
  const sheet=clothY(x,z,t);
  const tipY=t<3.25?sheet+mix(.13,-.245,down):sheet+mix(-.24,.345,up)+away*.75;
  const direction=new THREE.Vector3(-.13*(1-turn)+.1*turn,Math.cos(turn*Math.PI),.06).normalize();
  const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction);
  const tip=new THREE.Vector3(x,tipY,z);
  const eye=tip.clone().add(direction.clone().multiplyScalar(.208));
  return {tip,eye,rotation,visible:t<7};
}

export function cameraState(t:number) {
  const exit=ease(t,8.4,15.8);
  const follow=ease(t,3.45,5.5);
  const enter=ease(t,.75,2.8);
  const target=new THREE.Vector3(
    mix(HOLE.x+.012, -.25,exit),
    mix(mix(.370,.158,enter)+.12*follow,.1,exit),
    mix(SEAM+.009, .2,exit)
  );
  const p=new THREE.Vector3(
    mix(HOLE.x+.115-.03*Math.sin(t*.4),1.05,exit),
    mix(mix(.610,.375,enter)+.20*follow,8.8,exit),
    mix(SEAM+.43,7.0,exit)
  );
  return {position:p,target,fov:mix(40,42,exit),focus:p.distanceTo(target),exit};
}

export function starPoints(cx:number,cz:number,r:number,angle=-Math.PI/2) {
  return Array.from({length:10},(_,i)=>{const a=angle+i*Math.PI/5;const s=i%2?r*.38196601125:r;return new THREE.Vector2(cx+Math.cos(a)*s,cz+Math.sin(a)*s);});
}

export function clipPolygon(points:THREE.Vector2[],z:number,top:boolean) {
  const result:THREE.Vector2[]=[];
  const inside=(p:THREE.Vector2)=>top?p.y<=z:p.y>=z;
  for(let i=0;i<points.length;i++) {
    const a=points[i],b=points[(i+1)%points.length];
    if(inside(a))result.push(a.clone());
    if(inside(a)!==inside(b)) {
      const u=(z-a.y)/(b.y-a.y);
      result.push(new THREE.Vector2(mix(a.x,b.x,u),z));
    }
  }
  return result;
}

export function starGeometry(points:THREE.Vector2[],cuts=4) {
  const shape=new THREE.Shape();
  points.forEach((p,i)=>i?shape.lineTo(p.x,-p.y):shape.moveTo(p.x,-p.y));
  shape.closePath();
  const src=new THREE.ShapeGeometry(shape).toNonIndexed();
  const arr=src.getAttribute('position').array;
  let triangles:THREE.Vector3[][]=[];
  for(let i=0;i<arr.length;i+=9) triangles.push([new THREE.Vector3(arr[i],0,-arr[i+1]),new THREE.Vector3(arr[i+3],0,-arr[i+4]),new THREE.Vector3(arr[i+6],0,-arr[i+7])]);
  for(let k=0;k<cuts;k++) {
    const next:THREE.Vector3[][]=[];
    for(const [a,b,c] of triangles) {
      const ab=a.clone().lerp(b,.5),bc=b.clone().lerp(c,.5),ca=c.clone().lerp(a,.5);
      next.push([a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]);
    }
    triangles=next;
  }
  const pos:number[]=[];const uv:number[]=[];
  for(const tri of triangles)for(const p of tri){pos.push(p.x,0,p.z);uv.push(p.x/.052,p.z/.052);}
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  const merged=mergeVertices(geometry,.000001);
  merged.computeVertexNormals();
  merged.userData.rest=new Float32Array(merged.getAttribute('position').array);
  geometry.dispose();
  src.dispose();
  return merged;
}

export function deformStar(geometry:THREE.BufferGeometry,t:number,corner=false) {
  const pos=geometry.getAttribute('position');
  const rest=geometry.userData.rest as Float32Array;
  const offset=corner?-gap(t):0;
  for(let i=0;i<pos.count;i++) {
    const x=rest[i*3],z=rest[i*3+2]+offset;
    pos.setXYZ(i,x,clothY(x,z,t)+.006,z);
  }
  pos.needsUpdate=true;
  geometry.computeVertexNormals();
}
