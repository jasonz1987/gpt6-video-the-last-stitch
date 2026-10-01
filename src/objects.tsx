import {useMemo,useLayoutEffect} from 'react';
import * as THREE from 'three';
import {RoundedBox} from '@react-three/drei';
import {starPoints,starGeometry,ease,mix} from './motion';
export type V3=[number,number,number];
export const metal=new THREE.MeshPhysicalMaterial({color:'#a6a9a5',metalness:.92,roughness:.28});
export const iron=new THREE.MeshStandardMaterial({color:'#182322',metalness:.64,roughness:.45});
export const timber=new THREE.MeshStandardMaterial({color:'#765236',roughness:.75});
export const brass=new THREE.MeshStandardMaterial({color:'#a68a4a',metalness:.75,roughness:.38});
export const ropeMat=new THREE.MeshStandardMaterial({color:'#b5a17e',roughness:.95});
export function Box({position=[0,0,0],size,color='#6d6052',material,radius=.025,rotation=[0,0,0]}:{position?:V3,size:V3,color?:string,material?:THREE.Material,radius?:number,rotation?:V3}) {
 return <RoundedBox args={size} radius={Math.min(radius,...size.map(v=>v*.4))} smoothness={2} position={position} rotation={rotation} castShadow receiveShadow>
  {material?<primitive attach="material" object={material}/>:<meshStandardMaterial color={color} roughness={.82}/>}
 </RoundedBox>;
}
export function Rod({a,b,r=.02,material=iron}:{a:V3,b:V3,r?:number,material?:THREE.Material}) {
 const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b);
 const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),bv.clone().sub(av).normalize());
 return <mesh position={av.clone().lerp(bv,.5)} quaternion={q} material={material} castShadow><cylinderGeometry args={[r,r,av.distanceTo(bv),12]}/></mesh>;
}
export function Tube({points,r=.012,material=ropeMat}:{points:THREE.Vector3[],r?:number,material?:THREE.Material}) {
 const g=useMemo(()=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),Math.max(32,points.length*6),r,6,false),[points,r]);
 useLayoutEffect(()=>()=>g.dispose(),[g]);
 return <mesh geometry={g} material={material} castShadow/>;
}
export function Cup({position=[0,0,0]}:{position?:V3}) {
 const g=useMemo(()=>new THREE.LatheGeometry([new THREE.Vector2(.15,0),new THREE.Vector2(.18,.02),new THREE.Vector2(.20,.34),new THREE.Vector2(.184,.35),new THREE.Vector2(.167,.04),new THREE.Vector2(0,.04)],48),[]);
 return <group position={position}>
  <mesh geometry={g} castShadow receiveShadow><meshPhysicalMaterial color="#e8dfc8" roughness={.24} clearcoat={.7}/></mesh>
  <mesh position={[.21,.18,0]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.093,.021,10,32]}/><meshStandardMaterial color="#e5d7bb"/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,.303,0]}><circleGeometry args={[.174,48]}/><meshPhysicalMaterial color="#563316" roughness={.2} metalness={.1}/></mesh>
 </group>;
}
export function ThreadBox({t=12,position=[0,0,0],scale=1}:{t?:number,position?:V3,scale?:number}) {
 const open=ease(t,1.8,5.2);
 return <group position={position} scale={scale}>
  <Box position={[0,.08,0]} size={[.94,.16,.64]} color="#a49773" radius={.07}/>
  <Box position={[0,.172,0]} size={[.86,.024,.56]} color="#302d26" radius={.03}/>
  <group position={[0,.17,-.295]} rotation={[-open*1.65,0,0]}>
   <Box position={[0,0,.295]} size={[.94,.042,.64]} color="#b4a780" radius={.06}/>
   <Box position={[0,-.025,.295]} size={[.75,.016,.46]} color="#716449" radius={.02}/>
  </group>
  {[-.26,.23].map((x,i)=><group key={x} position={[x,.238,-.08]} rotation={[0,0,Math.PI/2]}>
   <mesh material={timber}><cylinderGeometry args={[.085,.085,.25,24]}/></mesh>
   <mesh><cylinderGeometry args={[.072,.072,.18,32]}/><meshStandardMaterial color={i?'#bd222d':'#c5b78e'} roughness={.95}/></mesh>
  </group>)}
  <Rod a={[-.15,.226,.14]} b={[.20,.23,.04]} r={.0022} material={metal}/>
  <mesh rotation={[Math.PI/2,0,-.32]} position={[.2,.231,.04]} material={metal}><torusGeometry args={[.009,.0018,6,16]}/></mesh>
  <Tube r={.0026} points={[new THREE.Vector3(.2,.232,.04),new THREE.Vector3(.32,.242,.09),new THREE.Vector3(.32,.23,.2),new THREE.Vector3(.1,.23,.21),new THREE.Vector3(-.06,.23,.12)]}/>
 </group>;
}
export function Flag({t,width=3,height=2,mode='wind',progress=0,fold=0}:{t:number,width?:number,height?:number,mode?:'wind'|'roll'|'flat',progress?:number,fold?:number}) {
 const geometries=useMemo(()=>{
  const plane=new THREE.PlaneGeometry(width,height,96,64);
  plane.userData.rest=new Float32Array(plane.getAttribute('position').array);
  const big={x:-width/3,y:height/4,r:height*.15};
  const parts=[plane,starGeometry(starPoints(big.x,-big.y,big.r),3)];
  for(const [gx,gy] of [[10,2],[12,4],[12,7],[10,9]]) {
   const x=-width/2+gx/30*width,y=height/2-gy/20*height;
   const angle=Math.atan2(-big.y+y,big.x-x);
   parts.push(starGeometry(starPoints(x,-y,height*.05,angle),2));
  }
  return parts;
 },[width,height]);
 const red=useMemo(()=>new THREE.MeshPhysicalMaterial({color:'#b81126',roughness:.78,sheen:1,sheenColor:new THREE.Color('#e25856'),sheenRoughness:.55,side:THREE.DoubleSide}),[]);
 const gold=useMemo(()=>new THREE.MeshPhysicalMaterial({color:'#edc45b',roughness:.65,sheen:1,sheenColor:new THREE.Color('#ffe9a6'),sheenRoughness:.4,side:THREE.DoubleSide}),[]);
 useLayoutEffect(()=>{
  for(let k=0;k<geometries.length;k++) {
   const g=geometries[k],pos=g.getAttribute('position'),rest=g.userData.rest as Float32Array;
   for(let i=0;i<pos.count;i++) {
    const x=rest[i*3],y=k? -rest[i*3+2]:rest[i*3+1],u=(x+width/2)/width;
    if(mode==='roll') {
     const limit=mix(width/2,-width/2+.04,progress),distance=Math.max(0,x-limit),rad=.13+distance*.008;
     const theta=distance/rad;
     const xx=x>limit?limit+Math.sin(theta)*rad:x;
     const zz=x>limit?rad*(1-Math.cos(theta)):.018*Math.sin(x*3+y*2);
     const strip=height/4,q=(y+height/2)/strip;
     const folded=((q%2)<=1?q%2:2-q%2)*strip-strip/2;
     const lift=Math.sin(fold*Math.PI)*Math.abs(y-folded)*.28;
     pos.setXYZ(i,xx,mix(y,folded,fold),zz+lift+Math.floor(Math.min(q,3.999))*.007*fold+(k?.005:0));
    } else {
     const wave=mode==='flat'?.025*Math.sin(x*2.2+y*2.3):u*(.13*height*Math.sin(u*7.5-t*3+y*1.7)+.047*height*Math.sin(u*15.5-t*5.1+y*2.2));
     const sag=mode==='wind'?-.055*height*u*u:0;
     pos.setXYZ(i,x,y+sag,wave+(k?.006:0));
    }
   }
   pos.needsUpdate=true;g.computeVertexNormals();
  }
 },[t,geometries,width,height,mode,progress,fold]);
 useLayoutEffect(()=>()=>geometries.forEach(g=>g.dispose()),[geometries]);
 return <group>{geometries.map((g,i)=><mesh key={i} geometry={g} material={i?gold:red} castShadow/>)}</group>;
}
export function SmallFlag({t,position=[0,0,0],scale=1}:{t:number,position?:V3,scale?:number}) {
 return <group position={position} scale={scale}>
  <Rod a={[0,0,0]} b={[0,1.75,0]} r={.018} material={timber}/>
  <group position={[.45,1.37,0]}><Flag t={t} width={.90} height={.60}/></group>
  <Box position={[0,.07,0]} size={[.27,.12,.27]} color="#87704b" radius={.09}/>
 </group>;
}
