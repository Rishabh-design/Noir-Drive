"""
Pre-generate responsive WebP variants for next/image (see lib/image-loader.ts).

  python3 scripts/image-variants.py        (needs Pillow: pip install pillow)

For every public/assets/<section>/<name>.webp it writes <name>.<w>.webp for each
width below the source width, then rewrites lib/image-manifest.json. Widths at or
above the source width are served by the original file. Re-run after adding or
replacing a photo.
"""
import glob
import json
import os
import re

from PIL import Image

WIDTHS = [128, 256, 384, 640, 960, 1280, 1920, 2560, 3200]
ROOT = os.path.join(os.path.dirname(__file__), '..')
ASSETS = os.path.join(ROOT, 'public', 'assets')
SKIP = {'glow.webp'}  # decorative backgrounds served as-is

manifest = {}
for path in sorted(glob.glob(os.path.join(ASSETS, '*', '*.webp'))):
    name = os.path.basename(path)
    if re.search(r'\.\d+\.webp$', name) or name in SKIP:
        continue
    im = Image.open(path)
    rel = '/assets/' + os.path.relpath(path, ASSETS).replace(os.sep, '/')
    done = []
    for w in WIDTHS:
        if w >= im.width:
            break
        out = path[:-5] + f'.{w}.webp'
        im.resize((w, round(im.height * w / im.width)), Image.LANCZOS).save(out, 'WEBP', quality=78, method=6)
        done.append(w)
    manifest[rel] = done

with open(os.path.join(ROOT, 'lib', 'image-manifest.json'), 'w') as f:
    json.dump(manifest, f, indent=1, sort_keys=True)
print(f'{len(manifest)} images, {sum(map(len, manifest.values()))} variants')
