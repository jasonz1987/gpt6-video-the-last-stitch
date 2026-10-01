import path from 'node:path';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill,renderMedia,ensureBrowser,openBrowser} from '@remotion/renderer';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
process.chdir(root);
const cache=path.join(root,'.render-cache');
const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts'),outDir:path.join(cache,'review-bundle'),rspack:true});
const status=await ensureBrowser({chromeMode:'headless-shell',browserExecutable:process.env.STITCH_CHROME_EXECUTABLE});
const browser=await openBrowser('chrome',{browserExecutable:status.path,chromeMode:'headless-shell',chromiumOptions:{gl:'angle'}});
const inputProps={bgm:false,captions:true,signature:true,startFrame:0,includeAudio:false};
const composition=await selectComposition({serveUrl,id:'TheLastStitch',inputProps,puppeteerInstance:browser});
try {
 if(process.argv[2]==='range') {
  const start=Number(process.argv[3]),end=Number(process.argv[4]);
  await renderMedia({serveUrl,composition,inputProps,frameRange:[start,end],codec:'h264',crf:17,x264Preset:'fast',concurrency:1,imageFormat:'jpeg',jpegQuality:96,outputLocation:path.join(cache,`range-${start}-${end}.mp4`),puppeteerInstance:browser,chromiumOptions:{gl:'angle'},timeoutInMilliseconds:120000,onProgress:p=>{if(p.renderedFrames%60===0)console.log('Range rendered',p.renderedFrames);}});
 } else {
  await fs.mkdir(path.join(cache,'check-stills'),{recursive:true});
  for(const frame of process.argv.slice(2).map(Number)) {
   await renderStill({serveUrl,composition,inputProps,frame,scale:.6,imageFormat:'png',output:path.join(cache,'check-stills',`f${frame}.png`),puppeteerInstance:browser,chromiumOptions:{gl:'angle'},timeoutInMilliseconds:120000});
   console.log('Checked frame',frame);
  }
 }
}finally{await browser.close({silent:true});}
