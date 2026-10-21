# The Speckled Band

A first-person Sherlock Holmes mystery for the browser, adapted from Arthur Conan Doyle's
"The Adventure of the Speckled Band" (1892, public domain).

Search Julia Stoner's bedroom and Dr. Roylott's room for seven key clues, question Helen Stoner,
face down Dr. Roylott, set out the deduction, then keep the night watch. Plays on desktop and phone,
no install.

Built with Claude (game code) and Claude Design (every 3D model, from written prompts), using
Three.js 0.160.

## Layout

| Path | What it is |
|---|---|
| `src/page.html` | The page: styles, HUD, notebook, dialogue and deduction panels, intro screen |
| `src/game.js` | The game: rooms, lighting, controls, clues, conversations, deduction, night watch, prologue, sound |
| `models/*.glb` | The 7 models from Claude Design, shrunk losslessly with gltf-transform (`dedup`, then `weld`) |
| `tools/build.py` | Builds both versions into `dist/` |
| `tools/test/smoke.js` | Loads the game and fails on any error |
| `docs/` | The game brief, the lessons-learned kit for the next game, the Design prompts |

## Build

```
python3 tools/build.py
```

- `dist/artifact/speckled-band.html` is one self-contained page with the models packed inside (for claude.ai artifacts).
- `dist/netlify/speckled-band/` is a normal website with the models as files. `dist/speckled-band-netlify.zip` is the same folder zipped for Netlify drag-and-drop.

## Test

```
cd dist/netlify/speckled-band && python3 -m http.server 8000
node tools/test/smoke.js http://localhost:8000/
```

## Deploy

Netlify is linked to this repo: every push to `main` builds (`netlify.toml`) and goes live.

## Starting a new game from this one

See `docs/NEW-GAME-STARTER.md`.
