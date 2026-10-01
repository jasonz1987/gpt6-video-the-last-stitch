import {Composition,Folder} from 'remotion';
import {Film} from './Film';
import {SHOTS} from './timeline';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="TheLastStitch" component={Film} width={1920} height={1080} fps={30} durationInFrames={3000} defaultProps={{bgm:true,captions:true,signature:true,startFrame:0}} />
      <Folder name="Story-shots">
       {SHOTS.map(shot=><Composition key={shot.id} id={shot.id} component={Film} width={1920} height={1080} fps={30} durationInFrames={(shot.end-shot.start)*30} defaultProps={{bgm:true,captions:true,signature:true,startFrame:shot.start*30}}/>)}
      </Folder>
    </>
  );
};
