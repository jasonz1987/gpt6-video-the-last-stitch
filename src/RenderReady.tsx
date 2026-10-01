import {useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {continueRender} from 'remotion';

// Allow the separate R3F root and its postprocessing passes to settle before capture.
export function RenderReady({handle}:{handle:number}) {
 const {advance}=useThree();
 useLayoutEffect(()=>{
  let cancelled=false,tick=0,raf=0;
  const paint=()=>{
   if(cancelled)return;
   advance(performance.now());
   tick+=1;
   if(tick>=6)continueRender(handle);
   else raf=requestAnimationFrame(paint);
  };
  raf=requestAnimationFrame(paint);
  return ()=>{cancelled=true;cancelAnimationFrame(raf);};
 },[advance,handle]);
 return null;
}
