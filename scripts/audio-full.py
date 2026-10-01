from pathlib import Path
import json,subprocess,wave
import numpy as np
root=Path(__file__).resolve().parents[1]
audio=root/'public/audio';cache=root/'.render-cache';cache.mkdir(exist_ok=True)
sr=48000;duration=100
def decode(name,start=0,length=None):
 dst=cache/(Path(name).stem+'-decoded.wav')
 cmd=['ffmpeg','-v','error','-y','-ss',str(start),'-i',str(audio/name)]
 if length:cmd+=['-t',str(length)]
 subprocess.run(cmd+['-ar',str(sr),'-ac','2','-c:a','pcm_s16le',str(dst)],check=True)
 with wave.open(str(dst),'rb') as f:a=np.frombuffer(f.readframes(f.getnframes()),np.int16).reshape(-1,2).astype(np.float64)/32768
 return a
def save(name,a):
 with wave.open(str(audio/name),'wb') as f:
  f.setnchannels(2);f.setsampwidth(2);f.setframerate(sr)
  f.writeframes(np.clip(a*32767,-32768,32767).astype(np.int16).tobytes())
def norm(a):return a/max(np.max(np.abs(a)),.001)
def fade(a,seconds=.25):
 a=a.copy();n=min(len(a)//2,int(seconds*sr))
 a[:n]*=np.linspace(0,1,n)[:,None];a[-n:]*=np.linspace(1,0,n)[:,None]
 return a
time=np.arange(duration*sr)/sr
music=norm(decode('silent-descent.mp3',34,duration))[:len(time)]
music=np.pad(music,((0,max(0,len(time)-len(music))),(0,0)))
gain=np.interp(time,[0,2,12,18,27,34,45,61,67,78,81,93,97,100],[0,.26,.24,.20,.22,.34,.36,.34,.47,.45,.30,.34,.27,0])
music*=gain[:,None]
foley=np.zeros((len(time),2));events=[]
def place(clip,target,level,action,src,fadeSeconds=.18):
 clip=fade(norm(clip)*level,fadeSeconds);at=int(target*sr);end=min(len(foley),at+len(clip))
 foley[at:end]+=clip[:end-at]
 events.append({'frame':round(target*30),'seconds':target,'duration':round((end-at)/sr,3),'source':src,'gainAfterPeakNormalization':level,'action':action})
needle=decode('needle-through-fabric.mp3')
bins=960;mono=needle.mean(axis=1);rms=np.sqrt(np.mean(mono[:len(mono)//bins*bins].reshape(-1,bins)**2,axis=1))
choices=[p for p in range(1,len(rms)-1) if rms[p]>rms[p-1] and rms[p]>=rms[p+1] and rms[p]>.003]
peaks=[]
for p in sorted(choices,key=lambda p:rms[p],reverse=True):
 if all(abs(p-q)>=12 for q in peaks):peaks.append(p)
rank=sorted(peaks,key=lambda p:rms[p],reverse=True)
for i,target in enumerate([19.50,22.40]):
 peak=int(rank[i]*bins);start=max(0,peak-int(.13*sr));stop=min(len(needle),peak+int(.42*sr));clip=needle[start:stop]
 place(clip,target-(peak-start)/sr,.22-i*.025,'needle puncture: source transient aligned to target frame','needle-through-fabric.mp3',.008)
 events[-1]['targetTransientFrame']=round(target*30);events[-1]['sourcePeakSeconds']=peak/sr
pull=needle[int(5.3*sr):int(7.9*sr)]
place(pull,23.8,.063,'thread pulls through fabric','needle-through-fabric.mp3',.55)
place(needle[int(2.5*sr):int(7.9*sr)],37.1,.055,'cloth rolling and bundle friction','needle-through-fabric.mp3',.5)
place(pull,42.1,.065,'cord tightening proxy: recorded cloth friction','needle-through-fabric.mp3',.5)
wheel=decode('bicycle.mp3',2,17)
place(wheel,45,.19,'wheel and pedalling through three continuous street shots','bicycle.mp3',.55)
morning=decode('morning.mp3')
place(morning[int(22*sr):int(33.5*sr)],.4,.045,'air and birds outside the morning window','morning.mp3',1.0)
place(morning[int(66*sr):int(85.5*sr)],80.4,.057,'return to present-day window ambience','morning.mp3',1.2)
place(needle[int(2.5*sr):int(7.9*sr)],62.8,.036,'rope-friction texture while the flag rises','needle-through-fabric.mp3',.6)
for target in [70.4,73.6,76.4,83.1,87.2,92.6]:
 place(pull,target,.025,'restrained cloth flutter texture','needle-through-fabric.mp3',.7)
master=music+foley
factor=min(.72/max(np.max(np.abs(master)),.001),.071/max(np.sqrt(np.mean(master**2)),.001))
music*=factor;foley*=factor;master=music+foley
save('music-full.wav',music);save('foley-full.wav',foley);save('mix-full.wav',master)
(audio/'full-events.json').write_text(json.dumps(events,indent=2,ensure_ascii=False))
(audio/'mix-analysis.json').write_text(json.dumps({'duration':duration,'sampleRate':sr,'masterGain':float(factor),'peakDbfs':float(20*np.log10(np.max(np.abs(master)))),'rmsDbfs':float(20*np.log10(np.sqrt(np.mean(master**2)))),'verification':'Signal analysis, not a claim of listening.'},indent=2))
print('Prepared 100-second score, recorded foley and master',flush=True)
