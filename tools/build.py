"""Build The Speckled Band from src/ and models/.

    python3 tools/build.py

Makes two things in dist/ (not saved in Git, rebuild any time):
  dist/artifact/speckled-band.html   one self-contained page with the models packed inside,
                                     for publishing as a claude.ai artifact
  dist/netlify/speckled-band/        index.html + models/*.glb + favicon, netlify.toml, README.txt
  dist/speckled-band-netlify.zip     the same folder zipped, for Netlify's drag-and-drop deploy
"""
import base64, os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, MODELS, DIST = (os.path.join(ROOT, d) for d in ('src', 'models', 'dist'))
NAMES = ['bedroom', 'candle', 'roylott', 'helen', 'grimesby', 'adder', 'cane']

page = open(os.path.join(SRC, 'page.html'), encoding='utf-8').read()
game = open(os.path.join(SRC, 'game.js'), encoding='utf-8').read()
for n in NAMES:
    p = os.path.join(MODELS, n + '.glb')
    if open(p, 'rb').read(4) != b'glTF':
        sys.exit(f'{p} is not a GLB file')

# The source loads models with a placeholder loader; each build swaps in its own.
LOADER_START, LOADER_END = '// Each model is published as a text file', 'const parts = {};'
def swap_loader(js, new):
    a, b = js.index(LOADER_START), js.index(LOADER_END)
    return js[:a] + new + js[b:]

# ---------- claude.ai artifact: models embedded as base64 in the page ----------
EMBEDDED = '''// Each model is packed into the page itself (base64), so it always arrives with the page.
let modelsDone = 0, loadFailed = false;
function parseGLB(id) {
  return new Promise((res, rej) => {
    const el = $(id); if (!el) return rej(new Error('missing model ' + id));
    const bytes = decodeBase64(el.textContent);
    // a GLB file starts with the letters "glTF"; anything else means the page arrived incomplete
    if (bytes.length < 20 || bytes[0] !== 0x67 || bytes[1] !== 0x6c || bytes[2] !== 0x54 || bytes[3] !== 0x46) return rej(new Error('incomplete model ' + id));
    loader.parse(bytes.slice().buffer, '', g => { modelsDone++; if (!loadFailed) $('begin').textContent = `Loading the house… ${modelsDone} of 7`; res(g); }, rej);
  });
}
'''
tags = ''.join(f'<script type="application/octet-stream" id="glb-{n}">'
               + base64.b64encode(open(os.path.join(MODELS, n + '.glb'), 'rb').read()).decode()
               + '</script>\n' for n in NAMES)
assert page.count('<script type="importmap">') == 1
artifact = page.replace('<script type="importmap">', tags + '<script type="importmap">') + swap_loader(game, EMBEDDED)
os.makedirs(os.path.join(DIST, 'artifact'), exist_ok=True)
open(os.path.join(DIST, 'artifact', 'speckled-band.html'), 'w', encoding='utf-8').write(artifact)

# ---------- Netlify: a normal website, models fetched as .glb files ----------
FETCHED = '''// models are separate files on this host (cached by the browser between visits)
let modelsDone = 0, loadFailed = false;
function parseGLB(id) {
  const file = 'models/' + id.replace('glb-', '') + '.glb';
  return fetch(file).then(r => { if (!r.ok) throw new Error(file + ' ' + r.status); return r.arrayBuffer(); })
    .then(buf => new Promise((res, rej) => loader.parse(buf, '', g => { modelsDone++; if (!loadFailed) $('begin').textContent = `Loading the house… ${modelsDone} of 7`; res(g); }, rej)));
}
'''
N = os.path.join(DIST, 'netlify', 'speckled-band')
shutil.rmtree(os.path.join(DIST, 'netlify'), ignore_errors=True)
os.makedirs(os.path.join(N, 'models'))
for n in NAMES:
    shutil.copy(os.path.join(MODELS, n + '.glb'), os.path.join(N, 'models', n + '.glb'))
head = re.sub(r'<script type="application/octet-stream" id="glb-[a-z]+">__[A-Z]+__</script>\n', '', page)
assert 'octet-stream' not in head
meta = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>The Speckled Band</title>
<meta name="description" content="A first-person Sherlock Holmes mystery based on Arthur Conan Doyle's The Adventure of the Speckled Band. Search Stoke Moran, question the household, and keep the night watch.">
<meta property="og:title" content="The Speckled Band">
<meta property="og:description" content="A first-person Sherlock Holmes mystery. Search Stoke Moran, question the household, and keep the night watch.">
<meta property="og:type" content="website">
<meta name="theme-color" content="#120f0d">
<link rel="icon" href="favicon.svg" type="image/svg+xml">'''
rest = head[head.index('</title>') + len('</title>'):]
rest = rest.replace('<style>', '<style>\n*, *::before, *::after { box-sizing: border-box; }\nbody { margin: 0; }', 1)
i = rest.index('</style>') + len('</style>')
web = meta + rest[:i] + '\n</head>\n<body>\n' + rest[i:] + swap_loader(game, FETCHED) + '\n</body>\n</html>\n'
open(os.path.join(N, 'index.html'), 'w', encoding='utf-8').write(web)
open(os.path.join(N, 'favicon.svg'), 'w').write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#120f0d"/><path d="M14 46c6-10 12 6 18-4s12 6 18-6" fill="none" stroke="#e8a64a" stroke-width="6" stroke-linecap="round"/><circle cx="23" cy="44" r="2" fill="#5a3a26"/><circle cx="37" cy="43" r="2" fill="#5a3a26"/><circle cx="46" cy="38" r="1.8" fill="#5a3a26"/></svg>')
open(os.path.join(N, 'netlify.toml'), 'w').write('''# Netlify settings for The Speckled Band (a static site: no build step)
[build]
  publish = "."

[[headers]]
  for = "/models/*"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
    Content-Type = "model/gltf-binary"
''')
open(os.path.join(N, 'README.txt'), 'w').write('''The Speckled Band - a first-person Sherlock Holmes mystery for the browser.

Deploy on Netlify: unzip, then drag the unzipped folder onto https://app.netlify.com/drop,
or onto your site's Deploys tab to update it.

Run it locally (it must be served, opening index.html directly won't load the models):
  python3 -m http.server 8000   then open http://localhost:8000

Based on "The Adventure of the Speckled Band" by Arthur Conan Doyle (1892), public domain.
''')
# files at the top of the zip (no wrapper folder), so index.html lands at the site root
shutil.make_archive(os.path.join(DIST, 'speckled-band-netlify'), 'zip', os.path.join(DIST, 'netlify', 'speckled-band'))

mb = lambda p: f'{os.path.getsize(p) / 1e6:.1f} MB'
print('artifact page ', mb(os.path.join(DIST, 'artifact', 'speckled-band.html')))
print('netlify zip   ', mb(os.path.join(DIST, 'speckled-band-netlify.zip')))
