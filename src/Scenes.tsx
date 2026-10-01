import {Suspense,useLayoutEffect,useMemo} from 'react';
import {useThree,useLoader} from '@react-three/fiber';
import {Environment} from '@react-three/drei';
import {EffectComposer,DepthOfField,Vignette} from '@react-three/postprocessing';
import {staticFile} from 'remotion';
import {RenderReady} from './RenderReady';
import {cyclingPose,CRANK_CENTER} from './cycling';
import * as THREE from 'three';
import {World,Table,Room,Cloth} from './World';
import {HOLE,SEAM,WIDTH,HEIGHT,ease,mix} from './motion';
import {useWoodMaterial} from './Materials';
import {Box,Rod,Tube,Cup,ThreadBox,Flag,SmallFlag,V3,metal,timber,brass,ropeMat} from './objects';

const v=(p:V3)=>new THREE.Vector3(...p);
const blend=(a:V3,b:V3,p:number)=>v(a).lerp(v(b),p);
type View={position:THREE.Vector3,target:THREE.Vector3,fov:number,focusRange:number};
export function viewAt(t:number):View {
 let a:V3,b:V3,ta:V3,tb:V3,p:number,fov=40,focusRange=1.8;
 if(t<12){p=ease(t,2.2,11);a=[2.6,1.65,4.4];b=[.83,.73,1.03];ta=[0,.55,-.4];tb=[.55,.235,.23];fov=38;focusRange=mix(1.8,.28,p);}
 else if(t<18){p=ease(t,12.4,17.8);a=[HOLE.x+.82,1.02,SEAM+1.42];b=[HOLE.x+.13,.61,SEAM+.43];ta=[HOLE.x,.15,SEAM];tb=[HOLE.x,.37,SEAM];fov=40;focusRange=.18;}
 else if(t<45){const local=t-36,roll=ease(local,3.2,6.5);p=ease(local,0,8.2);a=[.75,4.8,5.5];b=[-2.15,1.24,1.84];ta=[-.4,.1,0];tb=[mix(-.4,-3.24,roll),.15,.1];fov=41;focusRange=1.6;}
 else if(t<50){p=ease(t,45,49.8);const x=(t-45)*.72-6;a=[x-.69,.48,1.16];b=[x-.30,.75,1.92];ta=[x-.65,.45,0];tb=[x-.4,.72,0];fov=37;focusRange=.8;}
 else if(t<57){p=ease(t,50,56.9);const x=(t-45)*.72-6;a=[x+.2,1.15,2.7];b=[x+.55,1.38,2.6];ta=[x+.05,1.0,0];tb=[x+.1,.95,0];fov=44;focusRange=1.8;}
 else if(t<62){p=ease(t,57,61.8);const x=(t-45)*.72-6;a=[x-1.8,1.45,1.6];b=[x-4.6,2.8,2.7];ta=[x-.45,1.14,0];tb=[x+2.8,1.1,0];fov=42;focusRange=3;}
 else if(t<70){p=ease(t,62.3,69.5);const y=mix(5.7,12.6,ease(t,62.6,69.4));a=[-3.8,3.0,9];b=[-3.0,7.2,11.5];ta=[-3.1,y-1.0,0];tb=[-1.1,y-1.7,0];fov=43;focusRange=5;}
 else if(t<80){p=ease(t,70.0,78.3);a=[-1.9,8.6,10.5];b=[-.3,9.7,12.3];ta=[-.2,10.2,0];tb=[.3,10.35,0];fov=43;focusRange=7;}
 else if(t<91){p=ease(t,80.8,89.5);a=[.15,1.53,.66];b=[2.45,1.65,4.1];ta=[-.63,1.38,-.66];tb=[.03,.73,-.42];fov=37;focusRange=mix(.7,2,p);}
 else{p=ease(t,91,96.8);a=[.6,2.2,-4.1];b=[4.8,5.1,-11.7];ta=[0,.65,.0];tb=[0,1.0,-1.4];fov=43;focusRange=6;}
 return {position:blend(a,b,p),target:blend(ta,tb,p),fov,focusRange};
}
function Camera({view}:{view:View}) {
 const {camera}=useThree();
 useLayoutEffect(()=>{camera.position.copy(view.position);camera.lookAt(view.target);(camera as THREE.PerspectiveCamera).fov=view.fov;camera.updateProjectionMatrix();},[camera,view]);
 return null;
}

function Plant({position=[0,0,0],scale=1,t=0}:{position?:V3,scale?:number,t?:number}) {
 const leaf=new THREE.MeshStandardMaterial({color:'#4c6841',roughness:.83,side:THREE.DoubleSide});
 return <group position={position} scale={scale}>
  <mesh position={[0,.2,0]} castShadow><cylinderGeometry args={[.18,.13,.4,24]}/><meshStandardMaterial color="#ad795a" roughness={.92}/></mesh>
  {Array.from({length:9},(_,i)=>{const a=i*2.399,yy=.38+i*.075;return <group key={i} rotation={[0,a,Math.sin(t*.7+i)*.024]}>
   <Rod a={[0,.3,0]} b={[.14,yy,.04]} r={.008} material={timber}/>
   <mesh material={leaf} position={[.20,yy,.04]} rotation={[0,0,-.25]} scale={[.13,.035,.065]}><sphereGeometry args={[1,16,8]}/></mesh>
  </group>;})}
 </group>;
}
function Buildings() {
 return <group>
  {Array.from({length:15},(_,i)=>{const x=(i-7)*2.8,z=-8-(i%3)*3,height=3.6+(i*7%5)*.72;return <group key={i}>
   <Box position={[x,height/2-1.4,z]} size={[2.15,height,2]} color={['#b4a38c','#aa9b86','#d2c5af','#9b998b'][i%4]} radius={.02}/>
   {Array.from({length:4},(_,r)=>[-.6,.6].map(dx=><mesh key={r+':'+dx} position={[x+dx,r*.73-.4,z+1.02]}>
    <planeGeometry args={[.40,.50]}/><meshStandardMaterial color={r%2?'#777a6f':'#dcc69c'} roughness={.45}/>
   </mesh>))}
  </group>;})}
 </group>;
}
function Curtain({x,t}:{x:number,t:number}) {
 const g=useMemo(()=>new THREE.PlaneGeometry(.60,3.15,20,40),[]);
 useLayoutEffect(()=>{const p=g.getAttribute('position');for(let i=0;i<p.count;i++){const xx=p.getX(i);const yy=p.getY(i);p.setZ(i,.055*Math.sin(xx*39)+.075*Math.sin(t*.8+yy*1.5)*(1-(yy+1.58)/3.15));}p.needsUpdate=true;g.computeVertexNormals();},[g,t]);
 return <mesh geometry={g} position={[x,1.77,-1.84]} castShadow><meshPhysicalMaterial color="#e5d7b9" roughness={.95} side={THREE.DoubleSide} transmission={.1} thickness={.01}/></mesh>;
}
function ModernRoom({t}:{t:number}) {
 const wood=useWoodMaterial();
 return <group>
  <Box position={[0,-.09,0]} size={[3.6,.18,2.05]} material={wood} radius={.035}/>
  {[-1.5,1.5].flatMap(x=>[-.78,.78].map(z=><Box key={x+':'+z} position={[x,-.72,z]} size={[.11,1.25,.11]} color="#6f563a"/>))}
  <Box position={[0,-1.47,0]} size={[9,.12,5.5]} color="#95846a"/>
  <Box position={[-3.2,1.2,-2.1]} size={[3.15,5.6,.25]} color="#c1af93"/>
  <Box position={[3.2,1.2,-2.1]} size={[3.15,5.6,.25]} color="#c1af93"/>
  <Box position={[0,-.87,-2.1]} size={[3.3,1.40,.25]} color="#c1af93"/>
  <Box position={[0,3.72,-2.1]} size={[3.3,.72,.25]} color="#c1af93"/>
  <Box position={[0,.08,-1.97]} size={[3.45,.12,.44]} color="#e2d2b8"/>
  {[-1.55,0,1.55].map(x=><Box key={x} position={[x,1.77,-2.05]} size={[.066,3.35,.13]} color="#9c7753"/>)}
  {[.18,1.8,3.36].map(y=><Box key={y} position={[0,y,-2.05]} size={[3.2,.055,.12]} color="#9c7753"/>)}
  <Curtain x={-1.32} t={t}/><Curtain x={1.32} t={t}/>
  <SmallFlag t={t} position={[-.98,.01,-.64]}/>
  <ThreadBox t={t<12?t:12} position={[.55,.005,.23]}/>
  <Cup position={[.93,.002,-.63]}/>
  <Plant position={[-1.20,.15,-1.88]} scale={.92} t={t}/>
  <Box position={[-.55,.012,.57]} size={[.68,.025,.43]} color="#eee2cd" radius={.005} rotation={[0,-.1,0]}/>
  {['#b02b2b','#dba54d','#345b57'].map((c,i)=><group key={c} position={[-.58+i*.13,.05,.64]} rotation={[0,.24+i*.14,Math.PI/2]}>
   <mesh castShadow><cylinderGeometry args={[.012,.012,.40,6]}/><meshStandardMaterial color={c}/></mesh>
  </group>)}
  <group position={[0,t>=91?-6.4:0,0]}><Buildings/></group>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,t>=91?-7.9:-1.54,0]} receiveShadow><planeGeometry args={[120,120]}/><meshStandardMaterial color="#9e947e" roughness={.93}/></mesh>
  {t>=91&&<group>
   <Box position={[0,-4.7,.6]} size={[9.8,6.2,5.8]} color="#b5a284" radius={.015}/>
   {[-4.8,4.8].map(x=><Box key={x} position={[x,1.25,.6]} size={[.20,5.6,5.8]} color="#b5a284"/>)}
   <Box position={[0,1.25,3.5]} size={[9.8,5.6,.22]} color="#b5a284"/>
   <Box position={[0,4.10,.6]} size={[9.9,.20,5.9]} color="#9d8c70"/>
   {[-5.9,-3.3].flatMap(y=>[-3.6,0,3.6].map(x=><group key={x+':'+y} position={[x,y,-2.35]}>
    <Box size={[1.60,1.90,.10]} color="#635d4f"/>
    <Box position={[0,0,-.075]} size={[.042,1.84,.03]} color="#b9a889"/>
    <Box position={[0,0,-.075]} size={[1.52,.038,.03]} color="#b9a889"/>
   </group>))}
  </group>}
  {/* Neighbouring windows establish a domestic exterior for the last shot. */}
  {[-3.65,3.65].map(x=><group key={x} position={[x,1.72,-2.25]}>
   <Box size={[1.7,2.4,.08]} color="#665c4d"/>
   <mesh position={[0,0,-.065]}><planeGeometry args={[1.45,2.1]}/><meshStandardMaterial color="#e0b786" emissive="#ce9759" emissiveIntensity={.25}/></mesh>
   <Box position={[0,0,-.10]} size={[.05,2.18,.07]} color="#655746"/>
   <Box position={[0,0,-.10]} size={[1.49,.045,.07]} color="#655746"/>
   <group position={[-.48,-.86,-.17]} scale={.31}><SmallFlag t={t}/></group>
  </group>)}
 </group>;
}

function Bundle({t}:{t:number}) {
 const p=ease(t,3.2,6.5),wrap=ease(t,6.5,8.0),fold=ease(t,.7,3.05);
 const x=mix(WIDTH/2,-WIDTH/2+.04,p),rad=.205;
 const points=Array.from({length:60},(_,i)=>{const a=i/59*Math.PI*2*Math.max(wrap,.001);return new THREE.Vector3(x+rad*Math.sin(a),.225+rad*Math.cos(a),.35);});
 return <><Table/><Room/>
  <group position={[0,.025,0]} rotation={[-Math.PI/2,0,0]}><Flag t={t} width={WIDTH} height={HEIGHT} mode="roll" progress={p} fold={fold}/></group>
  {t>6.5&&<><Tube r={.014} points={points}/><Tube r={.012} points={points.map(p=>p.clone().add(new THREE.Vector3(0,0,-.70)))}/></>}
 </>;
}

function Wheel({x,t}:{x:number,t:number}) {
 const tire=new THREE.MeshStandardMaterial({color:'#171c1a',roughness:.88});
 return <group position={[x,.45,0]} rotation={[0,0,-t*.72/.425]}>
  <mesh material={tire} castShadow><torusGeometry args={[.425,.033,12,64]}/></mesh>
  <mesh material={metal}><torusGeometry args={[.391,.010,6,64]}/></mesh>
  {Array.from({length:20},(_,i)=>{const a=i/20*Math.PI*2;return <Rod key={i} a={[0,0,0]} b={[Math.cos(a)*.39,Math.sin(a)*.39,0]} r={.0027} material={metal}/>;})}
  <Rod a={[0,0,-.075]} b={[0,0,.075]} r={.031} material={metal}/>
 </group>;
}
function Parcel() {
 return <group rotation={[0,0,Math.PI/2]}>
  <mesh castShadow><cylinderGeometry args={[.12,.12,.70,48]}/><meshPhysicalMaterial color="#a71525" roughness={.8} sheen={1} sheenColor="#d54a49"/></mesh>
  {[-.21,.21].map(y=><mesh key={y} material={ropeMat} position={[0,y,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.125,.010,6,32]}/></mesh>)}
 </group>;
}
function Rider({t}:{t:number}) {
 const coat=new THREE.MeshStandardMaterial({color:'#253130',roughness:.93});
 const skin=new THREE.MeshStandardMaterial({color:'#a99376',roughness:.85});
 return <group>
  <mesh position={[-.02,1.31,0]} rotation={[0,0,-.42]} material={coat} castShadow><capsuleGeometry args={[.12,.41,8,16]}/></mesh>
  <mesh position={[.22,1.65,0]} material={skin} scale={[.085,.11,.085]} castShadow><sphereGeometry args={[1,20,12]}/></mesh>
  <mesh position={[.218,1.733,0]} material={coat} scale={[1,.44,.85]} castShadow><sphereGeometry args={[.112,20,12]}/></mesh>
  <Box position={[.27,1.708,0]} size={[.20,.022,.18]} material={coat} radius={.015}/>
  {[-1,1].map(side=>{
   const z=side*.095;
   const {pedal,ankle,hip,knee}=cyclingPose(t,side);
   return <group key={side}>
    <Rod a={hip} b={knee} r={.058} material={coat}/><Rod a={knee} b={ankle} r={.043} material={coat}/>
    <mesh position={knee} material={coat}><sphereGeometry args={[.056,16,10]}/></mesh>
    <Rod a={[CRANK_CENTER[0],CRANK_CENTER[1],side*.14]} b={[pedal[0],pedal[1],side*.14]} r={.009} material={metal}/>
    <Rod a={[pedal[0],pedal[1],side*.125]} b={[pedal[0],pedal[1],side*.22]} r={.009} material={metal}/>
    <Box position={pedal} size={[.082,.018,.09]} color="#131917" radius={.004}/>
    <Box position={[ankle[0]+.046,ankle[1]-.016,ankle[2]]} size={[.19,.066,.083]} color="#1c2523" radius={.022}/>
    <Box position={[ankle[0]+.047,ankle[1]-.045,ankle[2]]} size={[.20,.016,.089]} color="#111916" radius={.007}/>
    <Box position={[ankle[0]-.005,ankle[1]+.013,ankle[2]]} size={[.059,.042,.069]} color="#253130" radius={.012}/>
    <Rod a={[.06,1.45,z]} b={[.42,1.23,z+side*.04]} r={.043} material={coat}/>
    <mesh position={[.42,1.23,z+side*.04]} material={coat}><sphereGeometry args={[.041,12,8]}/></mesh>
    <Rod a={[.42,1.23,z+side*.04]} b={[.69,1.16,z+side*.06]} r={.032} material={coat}/>
    <mesh position={[.69,1.16,z+side*.06]} material={skin}><sphereGeometry args={[.039,12,8]}/></mesh>
   </group>;
  })}
 </group>;
}
function Bicycle({t}:{t:number}) {
 const x=t*.72-6;
 return <group position={[x,.006*Math.sin(t*9),0]}>
  <Wheel x={-.66} t={t}/><Wheel x={.66} t={t}/>
  {[[[-.66,.45,0],[-.22,.99,0]],[[-.22,.99,0],[.03,.42,0]],[[.03,.42,0],[-.66,.45,0]],[[.03,.42,0],[.59,.91,0]],[[.59,.91,0],[-.22,.99,0]],[[.59,.91,0],[.66,.45,0]]].map((ab,i)=><Rod key={i} a={ab[0] as V3} b={ab[1] as V3} r={.016}/>)}
  <Rod a={[.6,.88,0]} b={[.68,1.14,0]} r={.018}/>
  <Rod a={[.68,1.14,-.18]} b={[.68,1.14,.18]} r={.012} material={metal}/>
  <Box position={[-.22,1.0,0]} size={[.27,.054,.14]} color="#3b2f23" radius={.025}/>
  <Rod a={[-.83,.46,0]} b={[-.83,.99,0]} r={.009} material={metal}/>
  <Box position={[-.65,1.0,0]} size={[.42,.016,.20]} color="#26312e" radius={.004}/>
  <group position={[-.70,1.15,0]} rotation={[0,Math.PI/2,0]}><Parcel/></group>
  <Rider t={t}/>
  <mesh position={[.025,.425,0]} rotation={[Math.PI/2,0,0]} material={metal}><cylinderGeometry args={[.080,.080,.013,24]}/></mesh>
 </group>;
}
function OldHouse({x,z,index}:{x:number,z:number,index:number}) {
 const h=2.45+(index%3)*.23,front=z>0?-1:1;
 return <group position={[x,0,z]}>
  <Box position={[0,h/2,-front*.5]} size={[3.1,h,1.5]} color={['#797d72','#888377','#676e67','#948a75'][index%4]} radius={.02}/>
  <Box position={[0,.90,front*.27]} size={[.75,1.8,.10]} color="#403e31"/>
  {[-.22,.22].map(dx=><Box key={dx} position={[dx,.96,front*.34]} size={[.25,1.36,.018]} color="#585243" radius={.006}/>)}
  {[-.99,.99].map(xx=><group key={xx} position={[xx,1.3,front*.31]}>
   <Box size={[.57,.71,.08]} color="#302e25" radius={.006}/>
   {[-.17,0,.17].map(dx=><Box key={dx} position={[dx,0,front*.048]} size={[.025,.67,.028]} color="#99917a" radius={.003}/>)}
   <Box position={[0,0,front*.052]} size={[.55,.025,.03]} color="#99917a" radius={.003}/>
  </group>)}
  {[-1,1].map(side=><Box key={side} position={[0,h+.11,side*.30-front*.40]} size={[3.4,.09,1.15]} rotation={[side*.29,0,0]} color="#393f3b" radius={.018}/>)}
  {Array.from({length:10},(_,i)=><Box key={i} position={[-1.48+i*.32,h+.08,front*.51]} size={[.04,.06,.34]} rotation={[-front*.28,0,0]} color="#4c514b" radius={.005}/>)}
 </group>;
}
function Street({t}:{t:number}) {
 const map=useLoader(THREE.TextureLoader,staticFile('textures/street.jpg'));
 useMemo(()=>{map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(14,2);map.anisotropy=16;},[map]);
 return <group>
  <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[70,8]}/><meshStandardMaterial map={map} color="#8c9187" roughness={.40} metalness={.12}/></mesh>
  {[-1,1].flatMap(side=>Array.from({length:14},(_,i)=><OldHouse key={side+':'+i} x={(i-5)*3.34} z={side*4.4} index={i}/>))}
  {[-4,6,16,26].map(x=><group key={x} position={[x,0,-2.6]}>
   <Rod a={[0,0,0]} b={[0,3.2,0]} r={.040}/>
   <Rod a={[0,3.16,0]} b={[0,3.16,.45]} r={.035}/>
   <mesh position={[0,3.05,.45]}><sphereGeometry args={[.10,16,12]}/><meshStandardMaterial color="#efd8ab" emissive="#efbc6f" emissiveIntensity={.35}/></mesh>
  </group>)}
  <Bicycle t={t}/>
 </group>;
}

function Gate() {
 return <group position={[0,0,-15]}>
  <Box position={[0,1.05,0]} size={[27,2.1,3.5]} color="#813b31" radius={.03}/>
  <Box position={[0,2.9,0]} size={[17,1.8,2.8]} color="#79372e" radius={.025}/>
  {[-8,-6,-4,-2,0,2,4,6,8].map(x=><Rod key={x} a={[x,2.1,1.45]} b={[x,3.8,1.45]} r={.10} material={timber}/>)}
  {[3.95,5.1].map((y,i)=><group key={y}>
   <Box position={[0,y,0]} size={[i?15:21,.14,4.5]} color="#b38f48"/>
   {[-1,1].map(side=><Box key={side} position={[0,y+.29,side*.94]} size={[i?13.3:19.6,.13,2.1]} rotation={[side*.32,0,0]} color="#a68a4e"/>)}
  </group>)}
  {[-8,-4,0,4,8].map(x=><Box key={x} position={[x,.85,1.81]} size={[1.7,1.7,.08]} color="#2a2c26" radius={.18}/>)}
 </group>;
}
function Crowd() {
 const count=150;
 const positions=useMemo(()=>Array.from({length:count},(_,i)=>new THREE.Vector3((i%25-12)*.43,-.01, -3.4-Math.floor(i/25)*.63)),[]);
 const coat=new THREE.MeshStandardMaterial({color:'#4b5148',roughness:1});
 return <group>{positions.map((p,i)=><group key={i} position={p} scale={1.0+(i*13%7)*.02}>
  <mesh position={[0,.80,0]} material={coat}><capsuleGeometry args={[.16,.65,2,8]}/></mesh>
  <mesh position={[0,1.34,0]}><sphereGeometry args={[.13,8,6]}/><meshStandardMaterial color="#9c8a70" roughness={1}/></mesh>
 </group>)}</group>;
}
function Ceremony({t}:{t:number}) {
 const top=mix(5.7,12.6,ease(t,62.6,69.4));
 return <group>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.035,0]} receiveShadow><planeGeometry args={[90,90]}/><meshStandardMaterial color="#aa9e87" roughness={.92}/></mesh>
  <Box position={[-3.4,.10,0]} size={[2,.20,2]} color="#c9bba2"/>
  <Rod a={[-3.4,0,0]} b={[-3.4,13.6,0]} r={.065} material={metal}/>
  <mesh position={[-3.4,13.7,0]} material={brass}><sphereGeometry args={[.13,24,16]}/></mesh>
  <Rod a={[-3.31,.24,.018]} b={[-3.31,13.5,.018]} r={.012} material={ropeMat}/>
  <Rod a={[-3.48,.24,.018]} b={[-3.48,13.5,.018]} r={.012} material={ropeMat}/>
  <group position={[-3.4+WIDTH/2,top-HEIGHT/2,.08]}><Flag t={t} width={WIDTH} height={HEIGHT}/></group>
  <Gate/><Crowd/>
  {Array.from({length:9},(_,i)=><mesh key={i} position={[(i-4)*8,18+(i%3)*2,-30]} scale={[5,.65,1.2]}>
   <sphereGeometry args={[1,16,8]}/><meshBasicMaterial color="#f1e7ce" transparent opacity={.12}/>
  </mesh>)}
 </group>;
}

export function SceneWorld({t,readyHandle}:{t:number,readyHandle:number}) {
 if(t>=18&&t<36)return <World readyHandle={readyHandle} tOverride={t-18}/>;
 const view=viewAt(t),outdoors=t>=45&&t<80,modern=t<12||t>=80,street=t>=45&&t<62;
 const bg=street?'#97a9a4':outdoors?'#91b3ba':modern?'#d0bfa4':'#16120f';
 return <>
  <Camera view={view}/><color attach="background" args={[bg]}/>
  <fog attach="fog" args={[bg,street?9:18,street?45:68]}/>
  <ambientLight color={outdoors?'#c2d5d5':'#e7d4b3'} intensity={outdoors?.55:.38}/>
  <directionalLight position={outdoors?[-8,18,-6]:[-4,4,-5]} color={outdoors?'#ffddb0':'#ffe1b6'} intensity={outdoors?2.3:2.0} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={22} shadow-camera-bottom={-22} shadow-camera-far={75} shadow-bias={-.00005} shadow-normalBias={.015}/>
  <directionalLight position={[5,5,4]} color="#91b9d2" intensity={outdoors?.35:.38}/>
  {!outdoors&&<rectAreaLight position={[0,4,-2]} rotation={[-Math.PI/2,0,0]} color="#fff0d6" intensity={1.4} width={4} height={3}/>}
  <Suspense fallback={null}>
   <Environment files={staticFile('textures/workshop.hdr')} environmentIntensity={outdoors?.38:.28}/>
   {modern?<ModernRoom t={t}/>:t<18?<><Table/><Room/><Cloth t={0}/></>:t<45?<Bundle t={t-36}/>:street?<Street t={t-45}/>:<Ceremony t={t}/>}
   <RenderReady handle={readyHandle}/>
  </Suspense>
  <EffectComposer multisampling={4}>
   <DepthOfField focusDistance={view.position.distanceTo(view.target)} focusRange={view.focusRange} bokehScale={street?1.35:1.8} resolutionScale={.75}/>
   <Vignette eskil={false} offset={.34} darkness={outdoors?.24:.31}/>
  </EffectComposer>
 </>;
}
