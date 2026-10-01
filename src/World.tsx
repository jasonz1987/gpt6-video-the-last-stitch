import {Suspense,useLayoutEffect,useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {Environment} from '@react-three/drei';
import {EffectComposer,DepthOfField,Vignette} from '@react-three/postprocessing';
import {useCurrentFrame,staticFile} from 'remotion';
import {RenderReady} from './RenderReady';
import * as THREE from 'three';
import {BIG,WIDTH,HEIGHT,SEAM,HOLE,clothY,needleState,cameraState,starPoints,starGeometry,deformStar,clipPolygon,gap,ease,mix} from './motion';
import {useClothMaterial,useWoodMaterial} from './Materials';

const silver=new THREE.MeshPhysicalMaterial({color:'#eee8df',metalness:1,roughness:.18,envMapIntensity:1.65});
const yarn=new THREE.MeshStandardMaterial({color:'#c5a266',roughness:.68,metalness:0});
const darkWood=new THREE.MeshStandardMaterial({color:'#271e18',roughness:.85});
const brass=new THREE.MeshStandardMaterial({color:'#91703c',metalness:.75,roughness:.5});

const Filament=({points,radius=.0016,material=yarn}:{points:THREE.Vector3[],radius?:number,material?:THREE.Material})=>{
 const geometry=useMemo(()=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),Math.max(24,points.length*12),radius,6,false),[points,radius]);
 useLayoutEffect(()=>()=>geometry.dispose(),[geometry]);
 return <mesh geometry={geometry} material={material} castShadow/>;
};

function Camera({t}:{t:number}) {
 const {camera}=useThree();
  useLayoutEffect(()=>{
  const state=cameraState(t);
  camera.position.copy(state.position);camera.lookAt(state.target);
  (camera as THREE.PerspectiveCamera).fov=state.fov;camera.updateProjectionMatrix();
 },[camera,t]);
 return null;
}

export function Cloth({t}:{t:number}) {
 const red=useClothMaterial('#b81121');
 const gold=useClothMaterial('#d8ae52',true);
 const plane=useMemo(()=>{
  const g=new THREE.PlaneGeometry(WIDTH,HEIGHT,232,168);
  g.rotateX(-Math.PI/2);
  const pos=g.getAttribute('position');const uv=g.getAttribute('uv');
  g.userData.rest=new Float32Array(pos.array);
  for(let i=0;i<pos.count;i++)uv.setXY(i,pos.getX(i)/.052,pos.getZ(i)/.052);
  return g;
 },[]);
 const geometries=useMemo(()=>{
   const points=starPoints(BIG.x,BIG.z,BIG.r);
   const parts=[starGeometry(clipPolygon(points,SEAM,false),5),starGeometry(clipPolygon(points,SEAM,true),4)];
   const positions=[[10,2],[12,4],[12,7],[10,9]];
   for(const [gx,gz] of positions){
    const x=-WIDTH/2+gx/30*WIDTH,z=-HEIGHT/2+gz/20*HEIGHT;
    const angle=Math.atan2(BIG.z-z,BIG.x-x);
    parts.push(starGeometry(starPoints(x,z,.25,angle),3));
   }
   return parts;
 },[]);
 useLayoutEffect(()=>{
   const detail=1-ease(t,9.0,14.3);
   red.bumpScale=.000005+.000275*detail;
   gold.bumpScale=.000005+.000215*detail;
   const pos=plane.getAttribute('position');const rest=plane.userData.rest as Float32Array;
   for(let i=0;i<pos.count;i++){const x=rest[i*3],z=rest[i*3+2];pos.setXYZ(i,x,clothY(x,z,t),z);}
   pos.needsUpdate=true;plane.computeVertexNormals();
   geometries.forEach((g,i)=>deformStar(g,t,i===1));
 },[plane,geometries,red,gold,t]);
 const stitches=useMemo(()=>{
  const list:THREE.Vector3[][]=[];
  for(let i=0;i<14;i++) {
    const x=BIG.x-.135+i*.021;
    if(Math.abs(x-HOLE.x)<.029)continue;
    const za=SEAM+.008,zb=SEAM-.008-gap(t);
    list.push([new THREE.Vector3(x,clothY(x,za,t)+.007,za),new THREE.Vector3(x+.002,clothY(x,SEAM,t)+.009,SEAM-gap(t)/2),new THREE.Vector3(x,clothY(x,zb,t)+.007,zb)]);
  }
  return list;
 },[t]);
 return <>
  <mesh geometry={plane} material={red} castShadow/>
  {geometries.map((g,i)=><mesh key={i} geometry={g} material={gold} castShadow/>)}
  {stitches.map((p,i)=><Filament key={i} points={p} radius={.0011}/>)}
 </>;
}

function Needle({t}:{t:number}) {
 const state=needleState(t);
 const geometry=useMemo(()=>{
   const shape=new THREE.Shape();
   shape.moveTo(-.0038,.179);shape.bezierCurveTo(-.010,.19,-.010,.215,-.0038,.224);
   shape.bezierCurveTo(.0038,.23,.010,.215,.009,.203);
   shape.bezierCurveTo(.008,.19,.004,.181,.0038,.179);shape.closePath();
   const hole=new THREE.Path();hole.absellipse(0,.206,.0034,.012,0,Math.PI*2,true,0);shape.holes.push(hole);
   return new THREE.ExtrudeGeometry(shape,{depth:.004,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.00075,bevelThickness:.0007});
 },[]);
 const body=useMemo(()=>new THREE.LatheGeometry([new THREE.Vector2(.00003,0),new THREE.Vector2(.0018,.014),new THREE.Vector2(.0031,.04),new THREE.Vector2(.0038,.175),new THREE.Vector2(.0036,.186)],24),[]);
 return <group visible={state.visible} position={state.tip} quaternion={state.rotation}>
  <mesh geometry={body} material={silver} castShadow/>
  <mesh geometry={geometry} material={silver} castShadow position={[0,0,-.002]}/>
 </group>;
}

function WorkingThread({t}:{t:number}) {
 const state=needleState(t);
 const a=new THREE.Vector3(HOLE.x-.012,clothY(HOLE.x,SEAM,t)+.009,SEAM+.012);
 const b=new THREE.Vector3(HOLE.x+.026,clothY(HOLE.x,SEAM,t)+.01,SEAM-.012-gap(t));
 const tighten=ease(t,5.65,8.15);
 const points:THREE.Vector3[]=t<3.3?[
  a,a.clone().add(new THREE.Vector3(-.03,.043,.025)),state.eye.clone(),state.eye.clone().add(new THREE.Vector3(-.10,.018,-.025)),state.eye.clone().add(new THREE.Vector3(-.19,.04,-.008)),
 ]:t<5.65?[
  a,a.clone().add(new THREE.Vector3(-.03,-.025,.012)),state.eye.clone(),state.eye.clone().add(new THREE.Vector3(.055,.022,-.015)),b,
 ]:[
  a,new THREE.Vector3(HOLE.x-.045*(1-tighten),a.y+.10*(1-tighten)+.002,SEAM-.04*(1-tighten)),
  new THREE.Vector3(mix(a.x,b.x,.55),a.y+.15*(1-tighten)+.003,SEAM-.075*(1-tighten)),b,
 ];
 const settle=ease(t,7.05,8.1);
 const tail=t>=5.65&&t<8.1?[b,b.clone().add(new THREE.Vector3(.015,.06,-.005)).lerp(b,settle),state.eye.clone().lerp(b,settle),state.eye.clone().add(new THREE.Vector3(.1,.035,-.02)).lerp(b.clone().add(new THREE.Vector3(.003,.003,-.003)),settle)]:null;
 return <>
  <Filament points={points} radius={.00145}/>
  {tail&&<Filament points={tail} radius={.00135}/>}
 </>;
}

export function Table() {
 const wood=useWoodMaterial();
 return <group>
  <mesh position={[0,-.155,2.05]} material={wood} receiveShadow castShadow><boxGeometry args={[9.7,.27,6.9]}/></mesh>
  {[-3.9,3.9].flatMap(x=>[-.55,4.55].map(z=><mesh key={x+':'+z} material={darkWood} position={[x,-1.1,z]}><boxGeometry args={[.23,1.7,.23]}/></mesh>))}
  <mesh position={[0,-2.05,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[60,60]}/><meshStandardMaterial color="#18120e" roughness={.95}/></mesh>
 </group>;
}

function Spool({position}:{position:[number,number,number]}) {
 return <group position={position} rotation={[0,0,Math.PI/2]}>
  <mesh material={darkWood}><cylinderGeometry args={[.11,.11,.25,48]}/></mesh>
  <mesh material={yarn}><cylinderGeometry args={[.086,.086,.19,64]}/></mesh>
  {[-.13,.13].map(y=><mesh key={y} material={darkWood} position={[0,y,0]}><cylinderGeometry args={[.122,.122,.025,48]}/></mesh>)}
  {Array.from({length:28},(_,i)=><mesh key={i} rotation={[Math.PI/2,0,0]} position={[0,-.087+i*.0064,0]} material={yarn}><torusGeometry args={[.086,.0016,4,48]}/></mesh>)}
 </group>;
}

function Scissors() {
 const blade=useMemo(()=>{
  const s=new THREE.Shape();s.moveTo(0,0);s.lineTo(.035,.7);s.lineTo(.10,.025);s.closePath();
  const g=new THREE.ExtrudeGeometry(s,{depth:.012,bevelEnabled:true,bevelSize:.008,bevelThickness:.005,bevelSegments:2});g.rotateX(-Math.PI/2);return g;
 },[]);
 return <group position={[3.93,.04,.74]} rotation={[0,-.57,0]}>
  {[-1,1].map(sign=><group key={sign} rotation={[0,sign*.075,0]}>
   <mesh geometry={blade} material={silver} position={[-.055,0,0]}/>
   <mesh rotation={[-Math.PI/2,0,0]} position={[sign*.09,0,.2]} material={brass} scale={[.72,1,1]}><torusGeometry args={[.10,.018,12,48]}/></mesh>
  </group>)}
  <mesh material={brass} position={[0,.021,0]}><sphereGeometry args={[.027,16,12]}/></mesh>
 </group>;
}

export function Room() {
 return <group>
  <mesh position={[0,2.5,-6.5]}><boxGeometry args={[14,9,.2]}/><meshStandardMaterial color="#484337" roughness={.95}/></mesh>
  <mesh position={[-3.3,2.9,-6.35]}><boxGeometry args={[2.3,3.8,.07]}/><meshBasicMaterial color="#bcb5a5"/></mesh>
  {[-1.1,0,1.1].map(dx=><mesh key={dx} material={darkWood} position={[-3.3+dx,2.9,-6.3]}><boxGeometry args={[.07,3.9,.12]}/></mesh>)}
  {[1.0,2.0,3.0,4.0,4.8].map(y=><mesh key={y} material={darkWood} position={[-3.3,y,-6.3]}><boxGeometry args={[2.3,.055,.12]}/></mesh>)}
  <mesh position={[-3.3,.88,-6.0]} material={darkWood}><boxGeometry args={[2.6,.13,.62]}/></mesh>
  <mesh position={[3.4,-.60,-5.7]} material={darkWood}><boxGeometry args={[2.4,2.6,.9]}/></mesh>
  {[-1,0,1].map(x=><mesh key={x} position={[3.4+x*.72,-.36,-5.22]}><boxGeometry args={[.66,1.86,.04]}/><meshStandardMaterial color="#3d3023" roughness={.8}/></mesh>)}
  {[-1,0,1].map(x=><mesh key={x} position={[3.4+x*.72,-.36,-5.16]} material={brass}><sphereGeometry args={[.026,12,10]}/></mesh>)}
  <Spool position={[3.95,.11,-.48]}/>
  <Spool position={[4.12,.11,-.1]}/>
  <Scissors/>
  <mesh position={[-3.99,.027,1.6]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.50,.90]}/><meshPhysicalMaterial color="#b89245" roughness={.5} sheen={1} sheenColor="#e9c87b"/></mesh>
 </group>;
}


export function World({readyHandle,tOverride}:{readyHandle:number,tOverride?:number}) {
 const frame=useCurrentFrame();
 const t=tOverride??frame/30;
 const state=cameraState(t);
 return <>
  <Camera t={t}/>
  <color attach="background" args={['#16120f']}/>
  <fog attach="fog" args={['#211810',14,34]}/>
  <ambientLight color="#c9b9a4" intensity={.13}/>
  <directionalLight position={[-4,4,-5]} color="#ffdfb5" intensity={1.85} castShadow shadow-mapSize={[4096,4096]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-camera-near={.2} shadow-camera-far={30} shadow-bias={-.00002} shadow-normalBias={.0007}/>
  <directionalLight position={[4,3,3]} color="#90a7c4" intensity={.33}/>
  <rectAreaLight position={[0,4,-2]} rotation={[-Math.PI/2,0,0]} color="#fff0db" intensity={1.6} width={5} height={2}/>
  <Suspense fallback={null}>
   <Environment files={staticFile('textures/workshop.hdr')} environmentIntensity={.23} environmentRotation={[0,Math.PI/3,0]}/>
   <Table/><Room/><Cloth t={t}/><Needle t={t}/><WorkingThread t={t}/><RenderReady handle={readyHandle}/>
  </Suspense>
  <EffectComposer multisampling={4}>
   <DepthOfField focusDistance={state.focus} focusRange={mix(.075,3.0,state.exit)} bokehScale={mix(4.0,1.0,state.exit)} resolutionScale={1}/>
   <Vignette eskil={false} offset={.32} darkness={.40}/>
  </EffectComposer>
 </>;
}
