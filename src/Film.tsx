import {AbsoluteFill,useCurrentFrame,useVideoConfig,staticFile,delayRender} from 'remotion';
import {useMemo} from 'react';
import {Audio} from '@remotion/media';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {SceneWorld} from './Scenes';
import {smooth} from './motion';
import {CAPTIONS,SHOTS} from './timeline';
export type FilmProps={bgm?:boolean,captions?:boolean,signature?:boolean,startFrame?:number,includeAudio?:boolean};
export function Film({bgm=true,captions=true,signature=true,startFrame=0,includeAudio=true}:FilmProps) {
 const frame=useCurrentFrame(),t=(frame+startFrame)/30;
 const {width,height}=useVideoConfig();
 const readyHandle=useMemo(()=>delayRender('Preparing the story’s photographic scene',{timeoutInMilliseconds:120000}),[frame,startFrame]);
 const caption=CAPTIONS.find(c=>t>=c.start&&t<c.end);
 const captionOpacity=caption?smooth(t,caption.start,caption.start+.5)*(1-smooth(t,caption.end-.5,caption.end)):0;
 const note=t<12?'2026 · 国庆清晨':t<36?'1949 · 典礼前夜':t>=62&&t<70?'1949 · 十月一日 · 午后':'';
 const noteOpacity=t<12?smooth(t,.8,1.8)*(1-smooth(t,3.1,3.8)):t<36?smooth(t,12.3,13)*(1-smooth(t,15.5,16.2)):smooth(t,62.3,63)*(1-smooth(t,66,66.8));
 const titleOpacity=smooth(t,93,94.2)*(1-smooth(t,99.1,100));
 const creditOpacity=(smooth(t,6.5,7.2)*(1-smooth(t,10.5,11.3))+smooth(t,32.5,33.2)*(1-smooth(t,35,35.6))+smooth(t,94,95))*.72;
 return <AbsoluteFill style={{background:'#17110c'}}>
  <ThreeCanvas key={SHOTS.find(s=>t>=s.start&&t<s.end)?.id} width={width} height={height} shadows camera={{fov:40,near:.005,far:120,position:[0,4,8]}} gl={{antialias:true,toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1.10,preserveDrawingBuffer:true}}>
   <SceneWorld t={t} readyHandle={readyHandle}/>
  </ThreeCanvas>
  <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(20,14,8,.05),transparent 28%,transparent 62%,rgba(20,12,7,.50))',pointerEvents:'none'}}/>
  <div style={{position:'absolute',left:0,right:0,top:0,height:64,background:'#110d0a'}}/>
  <div style={{position:'absolute',left:0,right:0,bottom:0,height:64,background:'#110d0a'}}/>
  {captions&&<>
   {note&&<div style={{position:'absolute',left:100,top:100,fontFamily:'Songti SC,STSong,serif',fontSize:39,letterSpacing:4,color:'#fff0d7',opacity:noteOpacity*.86,textShadow:'0 2px 10px #372712'}}>{note}</div>}
   {caption&&<div style={{position:'absolute',left:85,right:85,bottom:115,opacity:captionOpacity,textAlign:'center',color:'#fff1d7',textShadow:'0 3px 18px #20150d'}}>
    <div style={{fontFamily:'Songti SC,STSong,serif',fontSize:64,fontWeight:600,letterSpacing:4,lineHeight:1.25}}>{caption.zh}</div>
    <div style={{fontFamily:'Georgia,serif',fontSize:43,letterSpacing:.6,marginTop:14,color:'#eddfc4'}}>{caption.en}</div>
   </div>}
   <div style={{position:'absolute',left:0,right:0,top:345,textAlign:'center',opacity:titleOpacity,color:'#fff0d1',textShadow:'0 3px 22px #22180e'}}>
    <div style={{fontFamily:'Songti SC,STSong,serif',fontSize:133,fontWeight:600,letterSpacing:22}}>那一针</div>
    <div style={{fontFamily:'Georgia,serif',fontSize:39,letterSpacing:7,marginTop:15}}>THE LAST STITCH</div>
    <div style={{fontFamily:'Songti SC,STSong,serif',fontSize:58,letterSpacing:6,marginTop:62}}>祝祖国生日快乐</div>
    <div style={{fontFamily:'Georgia,serif',fontSize:36,letterSpacing:2,marginTop:15}}>Happy National Day</div>
   </div>
  </>}
  {signature&&<div style={{position:'absolute',right:94,bottom:15,fontFamily:'PingFang SC,sans-serif',fontSize:34,color:'#e2ceac',opacity:creditOpacity}}>本视频由 GPT-6.1 Sol 制作 · @ 晓刚开物</div>}
  <AbsoluteFill style={{background:'#110d0a',opacity:Math.max(1-smooth(t,0,.7),smooth(t,99.15,100))}}/>
  {includeAudio&&bgm&&<Audio src={staticFile('audio/music-full.wav')} trimBefore={startFrame}/>}
  {includeAudio&&<Audio src={staticFile('audio/foley-full.wav')} trimBefore={startFrame}/>}
 </AbsoluteFill>;
}
