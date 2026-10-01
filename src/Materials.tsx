import {useLoader} from '@react-three/fiber';
import {staticFile} from 'remotion';
import * as THREE from 'three';
import {useMemo} from 'react';

export function useClothMaterial(color:string,gold=false) {
  const [map,bump,rough]=useLoader(THREE.TextureLoader,['weave-soft.jpg','weave-height.png','weave-soft-rough.png'].map(f=>staticFile('textures/'+f)));
  return useMemo(()=>{
    for(const tex of [map,bump,rough]){tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=16;}
    map.colorSpace=THREE.SRGBColorSpace;
    return new THREE.MeshPhysicalMaterial({
      color,map,bumpMap:bump,bumpScale:gold?.00022:.00028,
      roughnessMap:rough,roughness:gold?.72:.9,
      metalness:0,sheen:1,sheenRoughness:gold?.35:.55,
      sheenColor:new THREE.Color(gold?'#f3d7a1':'#c35453'),
      anisotropy:gold?.82:.48,anisotropyRotation:Math.PI/2,
      envMapIntensity:gold?.58:.3,side:THREE.DoubleSide,
    });
  },[map,bump,rough,color,gold]);
}

export function useWoodMaterial() {
 const [map,bump]=useLoader(THREE.TextureLoader,['wood-color.jpg','wood-height.jpg'].map(f=>staticFile('textures/'+f)));
 return useMemo(()=>{
   map.colorSpace=THREE.SRGBColorSpace;
   for(const tex of [map,bump]){tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=16;tex.repeat.set(1.5,2.1);}
   return new THREE.MeshStandardMaterial({map,bumpMap:bump,bumpScale:.015,roughness:.72,color:'#cfb6a1'});
 },[map,bump]);
}
