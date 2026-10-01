import path from 'node:path';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill,renderMedia,ensureBrowser,openBrowser} from '@remotion/renderer';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const run=promisify(execFile);
process.chdir(root);
const cache=path.join(root,'.render-cache');
await fs.mkdir(cache,{recursive:true});
const output=path.join(root,'out');
await fs.mkdir(output,{recursive:true});
const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts'),outDir:path.join(cache,'bundle'),rspack:true});
const status=await ensureBrowser({chromeMode:'headless-shell',browserExecutable:process.env.STITCH_CHROME_EXECUTABLE});
if(!('path' in status))throw new Error('Chrome unavailable');
const gl={gl:'angle'};
const browser=await openBrowser('chrome',{browserExecutable:status.path,chromeMode:'headless-shell',chromiumOptions:gl});
const props={bgm:true,captions:true,signature:true,startFrame:0,includeAudio:false};
const composition=await selectComposition({serveUrl,id:'TheLastStitch',inputProps:props,puppeteerInstance:browser});
try {
  if(process.argv[2]==='stills') {
    const frames=process.argv.slice(3).map(Number);
    await fs.mkdir(path.join(cache,'stills'),{recursive:true});
    for(const frame of frames.length?frames:[90,285,440,590,760,980,1120,1275,1400,1550,1750,1950,2230,2440,2660,2900]) {
      await renderStill({serveUrl,composition,inputProps:props,frame,scale:.6,output:path.join(cache,'stills',`f${String(frame).padStart(4,'0')}.png`),imageFormat:'png',puppeteerInstance:browser,chromiumOptions:gl,timeoutInMilliseconds:120000});
      console.log('Checked frame',frame);
    }
  }else{
    let progress=-1;
    const silent=path.join(cache,'film-silent.mp4');
    await renderMedia({serveUrl,composition,inputProps:props,codec:'h264',crf:17,x264Preset:'fast',concurrency:3,imageFormat:'jpeg',jpegQuality:96,outputLocation:silent,puppeteerInstance:browser,chromiumOptions:gl,timeoutInMilliseconds:120000,onProgress:p=>{const n=Math.floor(p.progress*25);if(n!==progress){progress=n;console.log(`Rendering ${Math.round(p.progress*100)}% (${p.renderedFrames}/${composition.durationInFrames} frames)`);}}});
    // Direct mux from the authored stems preserves the common frame-zero origin.
    // QA measures the decoded signal; the sample's AAC correction is not reused.
    for(const [track,name] of [['mix-full.wav','national-day-the-last-stitch.mp4'],['foley-full.wav','national-day-the-last-stitch-sfx-only.mp4']]) {
      await run('ffmpeg',['-v','error','-y','-i',silent,'-i',path.join(root,'public/audio',track),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','256k','-t','100','-movflags','+faststart',path.join(output,name)]);
    }
    console.log('Saved both versions of The Last Stitch to out/');
  }
} finally {await browser.close({silent:true});}
