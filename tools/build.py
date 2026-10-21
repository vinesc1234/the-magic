"""Build The Magic from src/ and models/.

    python tools/build.py

Makes two things in dist/ (not saved in Git, rebuild any time):
  dist/artifact/the-magic.html   one self-contained page with the models packed inside,
                                 for publishing as a claude.ai artifact
  dist/netlify/the-magic/        index.html + models/*.glb + favicon, netlify.toml, README.txt
  dist/the-magic-netlify.zip     the same folder zipped

The list of models comes from `const MODELS = [...]` in src/game.js, so there is only one list to keep
up to date. (The Speckled Band kept two, one here and one in the game, and they had to be changed together.)
"""
import base64, json, os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, MODELS, DIST = (os.path.join(ROOT, d) for d in ('src', 'models', 'dist'))
SLUG = 'the-magic'

page = open(os.path.join(SRC, 'page.html'), encoding='utf-8').read()
game = open(os.path.join(SRC, 'game.js'), encoding='utf-8').read()
m = re.search(r'^const MODELS = (\[.*?\]);', game, re.M | re.S)
if not m:
    sys.exit('src/game.js has no `const MODELS = [...]` line')
NAMES = [n.replace('glb-', '') for n in json.loads(m.group(1).replace("'", '"'))]
for n in NAMES:
    p = os.path.join(MODELS, n + '.glb')
    if not os.path.exists(p):
        sys.exit(f'{p} is listed in MODELS but missing')
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
    loader.parse(bytes.slice().buffer, '', g => { modelsDone++; if (!loadFailed) $('begin').textContent = `Loading the attic… ${modelsDone} of ${MODELS.length}`; res(g); }, rej);
  });
}
'''
tags = ''.join(f'<script type="application/octet-stream" id="glb-{n}">'
               + base64.b64encode(open(os.path.join(MODELS, n + '.glb'), 'rb').read()).decode()
               + '</script>\n' for n in NAMES)
assert page.count('<script type="importmap">') == 1
artifact = page.replace('<script type="importmap">', tags + '<script type="importmap">') + swap_loader(game, EMBEDDED)
os.makedirs(os.path.join(DIST, 'artifact'), exist_ok=True)
open(os.path.join(DIST, 'artifact', SLUG + '.html'), 'w', encoding='utf-8').write(artifact)

# ---------- Netlify: a normal website, models fetched as .glb files ----------
FETCHED = '''// models are separate files on this host (cached by the browser between visits)
let modelsDone = 0, loadFailed = false;
function parseGLB(id) {
  const file = 'models/' + id.replace('glb-', '') + '.glb';
  return fetch(file).then(r => { if (!r.ok) throw new Error(file + ' ' + r.status); return r.arrayBuffer(); })
    .then(buf => new Promise((res, rej) => loader.parse(buf, '', g => { modelsDone++; if (!loadFailed) $('begin').textContent = `Loading the attic… ${modelsDone} of ${MODELS.length}`; res(g); }, rej)));
}
'''
N = os.path.join(DIST, 'netlify', SLUG)
shutil.rmtree(os.path.join(DIST, 'netlify'), ignore_errors=True)
os.makedirs(os.path.join(N, 'models'))
for n in NAMES:
    shutil.copy(os.path.join(MODELS, n + '.glb'), os.path.join(N, 'models', n + '.glb'))
meta = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>The Magic</title>
<meta name="description" content="A first-person game adapted from Frances Hodgson Burnett's A Little Princess. Someone has been coming into the attic while Sara sleeps. Find out who, and how, and why.">
<meta property="og:title" content="The Magic">
<meta property="og:description" content="A first-person game from Burnett's A Little Princess. Someone has been coming into the attic while Sara sleeps.">
<meta property="og:type" content="website">
<meta name="theme-color" content="#15112a">
<link rel="icon" href="favicon.svg" type="image/svg+xml">'''
rest = page[page.index('</title>') + len('</title>'):]
rest = rest.replace('<style>', '<style>\n*, *::before, *::after { box-sizing: border-box; }\nbody { margin: 0; }', 1)
i = rest.index('</style>') + len('</style>')
web = meta + rest[:i] + '\n</head>\n<body>\n' + rest[i:] + swap_loader(game, FETCHED) + '\n</body>\n</html>\n'
open(os.path.join(N, 'index.html'), 'w', encoding='utf-8').write(web)
# a crescent moon and a sparkle, on a plum night
open(os.path.join(N, 'favicon.svg'), 'w').write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#15112a"/><path d="M38 12a20 20 0 1 0 14 34A16 16 0 1 1 38 12z" fill="#f7efe4"/><path fill="#e9bb6c" d="M46 8C47 15 49 17 56 18C49 19 47 21 46 28C45 21 43 19 36 18C43 17 45 15 46 8Z"/></svg>')
open(os.path.join(N, 'netlify.toml'), 'w').write('''# Netlify settings for The Magic (a static site: no build step)
[build]
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/models/*"
  [headers.values]
    Content-Type = "model/gltf-binary"
''')
open(os.path.join(N, 'README.txt'), 'w').write('''The Magic - a first-person game for the browser, from Frances Hodgson Burnett's A Little Princess.

Run it locally (it must be served, opening index.html directly won't load the models):
  python -m http.server 8000   then open http://localhost:8000

Based on "A Little Princess" by Frances Hodgson Burnett (1905), public domain.
''')
shutil.make_archive(os.path.join(DIST, SLUG + '-netlify'), 'zip', N)

mb = lambda p: f'{os.path.getsize(p) / 1e6:.2f} MB'
print('models        ', ', '.join(NAMES) or '(none yet)')
print('artifact page ', mb(os.path.join(DIST, 'artifact', SLUG + '.html')))
print('netlify zip   ', mb(os.path.join(DIST, SLUG + '-netlify.zip')))
