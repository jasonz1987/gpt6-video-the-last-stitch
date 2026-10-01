import argparse,json,subprocess,wave
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description='Decode the export and verify frames, audio timing and matching video packets.')
parser.add_argument('--video',type=Path,default=root/'videos/national-day-the-last-stitch.mp4')
parser.add_argument('--sfx-video',type=Path)
parser.add_argument('--reference',type=Path,default=root/'public/audio/mix-full.wav')
parser.add_argument('--output',type=Path,default=root/'.render-cache/qa')
args=parser.parse_args()
video=args.video.resolve()
sfx_video=(args.sfx_video or video.parent/'national-day-the-last-stitch-sfx-only.mp4').resolve()
for required in [video,sfx_video,args.reference]:
 if not required.is_file():raise SystemExit(f'Missing {required}. Prepare audio with npm run assets && npm run audio before checking.')
qa=args.output.resolve();qa.mkdir(parents=True,exist_ok=True)
frames=[90,210,285,405,515,590,665,760,925,980,1095,1150,1220,1290,1380,1450,1550,1665,1740,1825,1920,2085,2135,2240,2360,2415,2520,2690,2790,2900,2960]
cuts=[360,540,1080,1350,1500,1710,1860,2100,2400,2730]
selected=set(frames+[n+d for n in cuts for d in [-2,-1,0,1,2]])
pipe=subprocess.Popen(['ffmpeg','-v','error','-i',str(video),'-an','-vf','scale=480:270','-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE)
means=[];changes=[];previous=None;images={};n=0
while True:
 raw=pipe.stdout.read(480*270*3)
 if not raw:break
 if len(raw)!=480*270*3:raise RuntimeError('Incomplete decoded frame')
 arr=np.frombuffer(raw,np.uint8).reshape(270,480,3);body=arr[20:250].astype(np.float32)
 means.append(float(body.mean()));changes.append(0 if previous is None else float(np.abs(body-previous).mean()));previous=body
 if n in selected:
  im=Image.fromarray(arr);im.save(qa/f'f{n:04}.jpg',quality=95)
  if n in frames:images[n]=im
 n+=1
if pipe.wait()!=0:raise RuntimeError('Video decoder failed')
sheet=Image.new('RGB',(1920,8*294),'#16130f');draw=ImageDraw.Draw(sheet)
for i,frame in enumerate(frames):
 x=(i%4)*480;y=(i//4)*294;sheet.paste(images[frame],(x,y));draw.text((x+12,y+276),f'{frame/30:.2f}s / frame {frame}',fill='#e8ddc9')
sheet.save(qa/'contact-sheet.jpg',quality=95)
# Extract full-resolution evidence independently from the encoded MP4.
native_frames=[285,440,674,760,980,1290,1550,1750,1950,2240,2520,2900]
expression='+'.join(f'eq(n\\,{frame})' for frame in native_frames)
subprocess.run(['ffmpeg','-v','error','-y','-i',str(video),'-vf','select='+expression,'-vsync','vfr','-frames:v',str(len(native_frames)),str(qa/'native-%02d.png')],check=True)
for index,frame in enumerate(native_frames,1):(qa/f'native-{index:02}.png').replace(qa/f'native-f{frame:04}.png')
black=[i for i,m in enumerate(means) if 22<i<2974 and m<4]
jumps=[{'frame':i,'meanDelta':round(means[i]-means[i-1],3)} for i in range(22,2974) if abs(means[i]-means[i-1])>12 and all(abs(i-c)>2 for c in cuts)]
subprocess.run(['ffmpeg','-v','error','-y','-i',str(video),'-vn','-ar','48000','-ac','2','-c:a','pcm_s16le',str(qa/'decoded-audio.wav')],check=True)
def load(p):
 with wave.open(str(p),'rb') as f:return np.frombuffer(f.readframes(f.getnframes()),np.int16).reshape(-1,2).astype(np.float64)/32768
actual=load(qa/'decoded-audio.wav');expected=load(args.reference);probes=[]
for start,length in [(19,4),(46,5),(82,6)]:
 left=start*48000;right=(start+length)*48000;a=actual[left:right].mean(axis=1);b=expected[left:right].mean(axis=1)
 fftlen=1<<(len(a)+len(b)-1).bit_length();cor=np.fft.irfft(np.fft.rfft(a,fftlen)*np.conj(np.fft.rfft(b,fftlen)),fftlen)
 lags=np.arange(-4800,4801);lag=int(lags[np.argmax(cor[lags%fftlen])]);probes.append({'sourceIntervalSeconds':[start,start+length],'lagSamples':lag,'lagFrames':round(lag/48000*30,4)})
hashes=[]
for file in [video,sfx_video]:
 hashes.append(subprocess.check_output(['ffmpeg','-v','error','-i',str(file),'-map','0:v:0','-c','copy','-f','hash','-hash','sha256','-'],text=True).strip())
metadata=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels','-of','json',str(video)],text=True))
result={'decodedFrames':n,'expectedFrames':3000,'blackFramesOutsideOpeningAndClosingFades':black,'unexpectedGlobalBrightnessJumps':jumps,'expectedCutFrames':cuts,'maxAdjacentFrameMeanPixelChange':round(max(changes[22:2974]),4),'audioPeakDbfs':round(float(20*np.log10(max(np.max(np.abs(actual)),1e-9))),2),'audioRmsDbfs':round(float(20*np.log10(max(np.sqrt(np.mean(actual**2)),1e-9))),2),'audioTimingProbes':probes,'videoPacketsIdenticalAcrossAudioVersions':hashes[0]==hashes[1],'videoSha256':hashes[0],'format':metadata,'audioVerification':'Signal and timing checked; listening to timbre is not claimed.'}
(qa/'technical-check.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2),flush=True)
if n!=3000 or black or jumps or any(abs(p['lagSamples'])>1600 for p in probes) or hashes[0]!=hashes[1]:raise RuntimeError('Export requires review')
