"""Prepare the exact credited assets without redistributing the stock score."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import urllib.request

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--with-music', action='store_true',
                    help='Download Silent Descent from Mixkit for local use under its license.')
parser.add_argument('--regenerate-textures', action='store_true',
                    help='Recreate the original deterministic fabric, wood and paving maps.')
args = parser.parse_args()
assets = json.loads((root / 'public/asset-sources.json').read_text())

for asset in assets:
    target = root / 'public' / asset['file']
    if not asset['included'] and not args.with_music:
        continue
    if not target.exists():
        print(f"Acquiring {asset['title']}\nLicense: {asset['licenseUrl']}", flush=True)
        request = urllib.request.Request(asset['downloadUrl'],
                                         headers={'User-Agent': 'TheLastStitch/1.0'})
        with urllib.request.urlopen(request, timeout=60) as response:
            data = response.read()
        if hashlib.sha256(data).hexdigest() != asset['sha256']:
            raise SystemExit(f"Source changed for {asset['file']}; review the official source before replacing it.")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    if hashlib.sha256(target.read_bytes()).hexdigest() != asset['sha256']:
        raise SystemExit(f"Checksum mismatch: {asset['file']}")
    print(f"Verified {asset['file']}", flush=True)

textures = root / 'public/textures'
if args.regenerate_textures:
    subprocess.run([sys.executable, str(root / 'scripts/create-textures.py')], check=True)
    Image.open(textures / 'weave-color.jpg').filter(ImageFilter.GaussianBlur(22)).save(
        textures / 'weave-soft.jpg', quality=96)
    Image.open(textures / 'weave-rough.png').filter(ImageFilter.GaussianBlur(24)).save(
        textures / 'weave-soft-rough.png')
    rng = np.random.default_rng(19491001)
    image = Image.new('RGB', (1024, 1024), '#50574f')
    draw = ImageDraw.Draw(image)
    for row in range(12):
        for col in range(7):
            x = col * 170 - (row % 2) * 85
            y = row * 87
            value = int(rng.integers(78, 100))
            draw.rounded_rectangle((x + 3, y + 3, x + 166, y + 82), radius=7,
                                   fill=(value + 10, value + 10, value + 3),
                                   outline=(value + 16, value + 17, value + 9), width=3)
    image.filter(ImageFilter.GaussianBlur(.8)).save(textures / 'street.jpg', quality=95)
    print('Regenerated original material maps.', flush=True)

required_maps = ['weave-soft.jpg', 'weave-height.png', 'weave-soft-rough.png',
                 'wood-color.jpg', 'wood-height.jpg', 'street.jpg', 'workshop.hdr']
for name in required_maps:
    if not (textures / name).is_file():
        raise SystemExit(f'Missing textures/{name}; run with --regenerate-textures.')
print('Assets ready. Run python3 scripts/audio-full.py to prepare the 100-second stems.', flush=True)
