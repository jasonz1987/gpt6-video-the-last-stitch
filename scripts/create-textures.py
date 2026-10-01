"""Original deterministic woven textile and wood material maps."""
from pathlib import Path
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parents[1] / 'public' / 'textures'
root.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(19491001)
n = 1024
y, x = np.mgrid[0:n, 0:n].astype(float)
period = 32
u, v = x / period, y / period
warp = np.cos(2*np.pi*(u + .032*np.sin(v*2*np.pi/8)))
weft = np.cos(2*np.pi*(v + .023*np.sin(u*2*np.pi/6)))
over = ((np.floor(u)+np.floor(v)) % 2)
height = .38 + .22*((1-over)*warp+over*weft) + .035*np.sin(x*2*np.pi/3) + .025*np.sin(y*2*np.pi/4)
height += rng.normal(0, .015, (n,n))
height = np.clip(height, 0, 1)
Image.fromarray((height*255).astype(np.uint8)).save(root/'weave-height.png')
rough = np.clip(.56 + .05*warp + .05*weft + rng.normal(0,.015,(n,n)), 0, 1)
Image.fromarray((rough*255).astype(np.uint8)).save(root/'weave-rough.png')
variation = .84 + .12*height + .04*np.cos(x*.011+y*.009)
Image.fromarray(np.clip(variation[:,:,None]*np.array([255,252,243]),0,255).astype(np.uint8)).save(root/'weave-color.jpg',quality=95)

n = 2048
y,x = np.mgrid[0:n,0:n].astype(float)
warp = y + 12*np.sin(x*.004) + 9*np.sin(x*.015+y*.004)
grain = .5 + .2*np.sin(warp*.15) + .12*np.sin(warp*.36) + .045*np.sin(warp*1.5)
grain += rng.normal(0,.038,(n,n))
grain = np.clip(grain,0,1)
color = np.array([70,38,21]) + grain[:,:,None]*np.array([55,39,24])
Image.fromarray(np.clip(color,0,255).astype(np.uint8)).save(root/'wood-color.jpg',quality=93)
Image.fromarray(np.clip(grain*255,0,255).astype(np.uint8)).save(root/'wood-height.jpg',quality=95)
print('Created five original material maps')
