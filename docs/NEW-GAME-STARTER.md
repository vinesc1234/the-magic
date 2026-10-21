# New Game Starter: build the next game on The Speckled Band's engine

Give this file to Claude Code at the start of a new game. It explains how to reuse The Speckled Band (a finished first-person 3D mystery game built in Three.js, with every model made in Claude Design) so a new game doesn't start from scratch, and it lists every lesson that cost time the first time round.

---

## 1. Paste this to Claude Code to start

> I'm building a new browser game, and I want to reuse my finished game The Speckled Band as the starting point. Read docs/NEW-GAME-STARTER.md in https://github.com/vinesc1234/speckled-band before doing anything else.
>
> My game: [one or two sentences: the source story or idea, who the player is, what they do, how it ends]
> What I had before: [what you tried, where it got stuck. Attach or link the old code if you have it]
>
> Follow the starter's steps. Start with the interview (step 1) and ask me the questions before writing any code.

---

## 2. Instructions for Claude Code

### Set up
1. Create a new GitHub repo for the game (ask the user for the name). Copy the contents of `vinesc1234/speckled-band` into it as the starting commit. Then remove the Speckled Band story content as you replace it (section 3). Keep the folder layout:
   - `src/page.html`: page, styles, HUD, notebook, dialogue and deduction panels, intro screen
   - `src/game.js`: all game code
   - `models/*.glb`: models from Claude Design
   - `tools/build.py`: builds `dist/` (a Netlify site and a single-file page)
   - `tools/test/smoke.js`: loads the game in headless Chromium and fails on any error
   - `netlify.toml`: Netlify builds straight from the repo
   - `docs/`: the new game's brief and design prompts
2. Update the model list in `tools/build.py` and in the `Promise.all([parseGLB(...)])` call in `game.js` to match the new game's models.
3. Ask the user to link the repo to a new Netlify site once (Site configuration, Build & deploy, Link repository). After that, every push to `main` goes live. Do not hand them zips to drag in. That kept failing to update the site.
4. Commit each change as its own step, with a plain message saying what changed for the player.

### If the new game isn't a first-person, room-based game
Keep the parts that don't depend on genre: the renderer and lighting setup, GLB loading (`parseGLB`, `decodeBase64`, `fixJoints`), the build and deploy pipeline, the tests, the loading screen, sound generation, the cutscene system and the dialogue panel. Replace the camera and controls. Say which parts you're keeping before you start.

## 3. What to keep and what to replace in `src/game.js`

| Keep as is (engine) | Replace per game (content) |
|---|---|
| `makeRoom` (walls, floor, ceiling, optional hole cut in a wall), `addWindow`, `addDoor`, `canvasTex`, `damask` (generated wallpaper and textures) | Room sizes, wall colours, where rooms sit relative to each other |
| `parseGLB`, `decodeBase64`, `fixJoints` (moves joints to where parts bend, because Design puts every joint at the feet), `proxy` (bigger invisible hit boxes) | Which models load and where they're placed |
| Walking and collision (`blocked`, room `colliders`), mouse look (`lockMouse`, skipped first moves), arrow-key turning, drag-to-look, phone joystick (`joyMove`) | Collider boxes for the new furniture |
| Examine under the dot (`pickTarget`, `setGlow`, `examine`, `openCard`, `closeCard`) | `CLUES` (every examinable thing and its text), `KEY` (the clues that matter) |
| Notebook with empty key-clue slots (`toggleNotebook`, `updateHud`) | `WHERE` (which room each key clue is in), milestones (`nextMilestone`) |
| Dialogue system (`openTalk`, `say`, `buildOptions`, `addFact`) | `SPEAKERS` (who you can talk to, their topics and lines) |
| Deduction screen (`renderDeduce`, `checkDeduce`) | `DQ` (questions, answers, hints, which clues prove each answer), `UNLOCK` |
| In-engine cutscene (`startCutscene`, `tickCutscene`, `cutCamera`, `endCutscene`, letterboxing, captions) | `CUT_KEYS` (camera path and timed events), `INTRO_TEXT` |
| Generated sound (`audioOn`, `noiseBuffer`, `startStorm`, `thunder`, `whistle`, `hiss`, `scream`) | Which sounds play and when |
| Curve-following animation (`buildSnakePath`, `updateSnake` with three.js `Flow`) for anything long and bendy | The finale (`startNight`, `tickNight`, `strike`, `showEnding`) |
| Main loop `tick`, `setRoomLights`, `goTo` (moving between rooms with a fade) | Characters and their rigs (`helenRig`, `roy`) |

## 4. The process

1. **Interview** (about 10 questions, asked before any code): source (public domain only, using the original text, nothing from modern adaptations), player role, point of view, length, mood, the core mechanic, rooms, characters, the ending, devices (desktop, phone), sound.
2. **Brief:** write `docs/game-brief.md`. Include a clue table listing every key clue, the room it's in, where it sits and how it's lit. Include a floor plan that says how the rooms connect (step 6 of the rules below).
3. **Design prompts:** write one Claude Design prompt per model in `docs/design-prompts.md`. Do rooms first, then props, then people. Apply the model rules (section 5). Decide the realism level now (section 6).
4. **Check each GLB** in the game before building on it: real size, origin, part names, how it looks from walking height.
5. **Build in this order:** rooms → clues → notebook → characters → the core mechanic → ending → intro cutscene → sound and phone polish. Playtest after each step and send the user screenshots.
6. **Ship:** push to `main` (Netlify deploys it). Optionally publish `dist/artifact/*.html` as a claude.ai artifact for quick sharing.

## 5. Model rules for Claude Design prompts (each one cost a fix)

- **Small clue details stand proud and contrast.** Write "raised 3 cm from the wall, lighter than the wallpaper", never "set into the wall". (The most important clue was flush and dark, and nobody found it.)
- **No stretched spheres for soft things.** Ask for pillows and cushions as rounded boxes with soft edges.
- **Real sizes in cm, origin at the base, facing +Z.** Say where the origin is for long things.
- **Name every part, with a pivot at each joint.** People get a separate head, eyes, upper arms, forearms and hands, plus knees if they will ever sit. (Design still tends to put every joint at the feet. `fixJoints` repairs that.)
- **One model per prompt,** and ask the user to send a screenshot with each GLB.
- **People and rooms in the same style.** If the furniture is realistic, the people must be too, or they look like dolls.

## 6. Gameplay, look and layout rules

- **Lay the rooms out as one floor plan first.** If the story says something passes between rooms (a vent, a window, a hole), line the rooms up so the openings really meet, cut a real hole, and put the doors on a shared corridor. Players notice when they don't line up.
- **Check that furniture doesn't overlap windows, doors or open shutters.** Take a top-down screenshot of each room.
- **Every key clue is visible from standing height,** lit, contrasting, and has an empty notebook slot saying which room it's in. Otherwise players think content is missing.
- **Thin or small clues get a bigger invisible hit box** (`proxy`).
- **Start brighter than feels right:** exposure about 1.4, ambient about 1.2, a soft ceiling fill in each room. Dark scenes turn the fill off and add one deliberate light on what the player must see.
- **People don't glow** when targeted. They get a prompt instead.
- **Controls:** click to capture the mouse, ignore the first 2 moves and any jump over 150 px, arrow keys turn, drag works as a fallback, joystick on phones.
- **Overlays need `position: fixed`** and a z-index. Hide the HUD during cutscenes.
- **Anything long and bendy (snakes, ropes, tails) follows a curve** with three.js `Flow`, not a chain of joints. Jointed versions look like toys.
- **Measure contact points instead of trusting model sizes.** Raycast down to the surface and fit to it. (A rope sank into a pillow.)
- **Realism comes from the models, not from lighting tricks.** A lighting and texture "realism pass" on simple models made no visible difference. Rebuilding the models with detailed prompts did.
- **Old or unusual words from the source stay,** but are explained in the clue text.

## 7. Delivery rules

- **Netlify:** build from GitHub with `netlify.toml` at the repo root (`command = "python3 tools/build.py"`, publish the `dist/netlify/<game>` folder). Don't cache files whose names never change: use `Cache-Control: public, max-age=0, must-revalidate`.
- **claude.ai artifact (optional):** embed the models in the page as base64 `<script type="application/octet-stream">` tags. Decode with the tolerant decoder (`decodeBase64`, never `atob()`) and check each starts with "glTF". Never load models as separate files next to an artifact. The viewer doesn't serve them.
- **Shrink models** with gltf-transform `dedup` then `weld`. Avoid `quantize`.

## 8. Testing rules

- **Test what the player sees, not just the game state.** Screenshot every key clue from where a player would stand. Headless Chromium needs `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`. It runs at about 1 fps, so allow long waits.
- **Reach test:** every clue must be examinable from somewhere the player can walk to.
- **Full playthrough test** that clicks real buttons, from the start screen to the end screen.
- **Before and after screenshots** for any lighting or look change.
- **When replacing a big block of code,** re-check every event handler that lived in it.

## 9. Working habits

- One milestone per session. Keep the brief at the top.
- Ask the user to batch playtest notes into one message.
- Don't use emojis or bullet symbols in anything written for the user to post.
