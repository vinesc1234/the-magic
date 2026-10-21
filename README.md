# The Magic

A first-person game for the browser, adapted from Frances Hodgson Burnett's novel
*A Little Princess* (1905, public domain).

You are Sara Crewe, eleven years old, cold and hungry in the attic of Miss Minchin's Select Seminary.
Someone has been coming into the attic at night. Search your attic, Becky's, and the leads outside your
skylight, then work out who has been coming in, how, and why. Plays on desktop and phone, no install.

Built with Claude (game code) and Claude Design (the 3D models, from written prompts), using
Three.js 0.160 and the engine from *The Speckled Band*. Everything in it comes from the novel: the
attics, the roofs, the people. No film or stage version was used, and all dialogue is original.

## Layout

| Path | What it is |
|---|---|
| `src/page.html` | The page: styles, HUD, notebook, dialogue and deduction panels, intro screen |
| `src/game.js` | The game: the attics and roofs, lighting, controls, clues, sound |
| `models/*.glb` | Models from Claude Design (none yet: the furniture is code-built stand-ins) |
| `tools/build.py` | Builds both versions into `dist/` |
| `tools/test/smoke.js` | Loads the game and fails on any error |
| `tools/test/shots.js` | Screenshots from standing height, top-downs, sightlines, and every way between rooms |
| `docs/game-brief.md` | The brief: status, next step, layout, clue table, deduction |
| `docs/design-prompts.md` | One Claude Design prompt per model |
| `docs/indie-game-kit.md` | The lessons-learned kit for the next game |

## Build

```
python tools/build.py
```

- `dist/artifact/the-magic.html` is one self-contained page with the models packed inside (for claude.ai artifacts).
- `dist/netlify/the-magic/` is a normal website with the models as files.

## Test

```
npm install
python -m http.server 8000 --bind 127.0.0.1 --directory dist/netlify/the-magic
node tools/test/smoke.js http://127.0.0.1:8000/
node tools/test/shots.js http://127.0.0.1:8000/ shots
```

## Deploy

Link Netlify to this repo once (Site configuration, Build and deploy, Link repository). After that every
push to `main` builds with `netlify.toml` and goes live.
