# Indie 3D Game Kit: how we build the next one

Use this for every new game in this project. It is the process and lessons from The Speckled Band (Oct 2026). Start a new game by saying: "New game. Use the indie game kit."

## Reuse, don't restart
- **Starting code:** `claude/speckled-band-src.html` is a working engine. Keep the systems and swap in the story:
  - Reuse as is: renderer and lighting setup, rooms (makeRoom, addWindow, addDoor), walking and collisions, mouse look, examine-under-the-dot with proxy hit boxes, the notebook with key-clue slots, the dialogue system (SPEAKERS), the deduction screen (DQ), the in-engine cutscene (CUT_KEYS), generated sounds, loading screen, both build scripts.
  - Replace per game: CLUES, KEY, SPEAKERS, DQ, WHERE, milestones, room layouts, models, the ending sequence.
- **Prompts:** claude/game-prompt-playbook.md (Design model template, brief template). claude/speckled-band-design-prompts.md is a worked example.
- **Process:** the steps below, one session per milestone, with the brief pasted at the top.

## The steps
1. **Interview** (about 10 questions): source IP (public domain, original text only), player role, point of view, length, mood, the core mechanic, rooms, characters, ending, devices, sound.
2. **Brief:** written to the project as claude/<game>-game-brief.md. Include a **clue table**: every key clue, the room it's in, where it sits, and how it's lit.
3. **Design prompts:** one model per prompt (rooms first, then props, then people). Apply the model rules below.
4. **Check each GLB** in-game before building on it: size, origin, part names, and how it looks from walking height.
5. **Build in steps:** room → clues → notebook → characters → the core mechanic → ending → intro cutscene → sound and phone polish. Playtest after each step.
6. **Ship:** artifact for quick play, Netlify zip for the public link.
7. **Portfolio:** screenshot plus a case study on sarahvresume, using the same headings as the other entries.

## Model rules for Claude Design (each one cost us a fix)
- **Small clue details stand proud and contrast.** Say "raised 3 cm from the wall, lighter than the wallpaper", never "set into the wall". (The ventilator, the most important clue, was flush and dark, so nobody could find it.)
- **No stretched spheres for soft things.** Ask for pillows and cushions as rounded boxes with soft edges. (The pillow came out as an egg.)
- **Real sizes in cm, origin at the base,** facing +Z. Note where the origin is for long things. (The snake's origin was mid-body, so it sat 50 cm too low.)
- **Name every part, with a pivot at each joint.** Give people separate head, eyes, arms and forearms. Give them knees if they will ever sit.
- **Send back a screenshot** with each GLB so problems are visible before any code is written.

## Gameplay and look rules
- **Every key clue:** visible from standing height, lit, contrasting, with an empty slot in the notebook saying which room it's in.
- **Thin or small clues get a larger invisible hit box** so the dot can't slip between bars.
- **Start brighter than feels right:** exposure about 1.4, ambient about 1.2, a soft ceiling fill in every room. Dark scenes (night, cutscenes) switch the fill off and add one deliberate light on what the player must see.
- **People don't glow** when targeted. They get a prompt instead.
- **Controls:** click to capture the mouse, ignore the first 2 moves and any jump over 150 px, arrow keys turn, drag works as a fallback, joystick on phones.
- **Overlays need `position: fixed`** and a z-index. Hide the HUD during cutscenes.
- **Old or unusual words from the source** (like "dog lash") stay, but get glossed in the clue text.
- **Decide the realism level before modelling, not after.** On Oct 16 we tried a "realistic look" pass on The Speckled Band: code-drawn textures, corner shading, bloom, reflections and a film grade. It cost twice the drawing work and players couldn't see the difference. Simple shapes stay simple-looking whatever the lighting does. Real realism needs photo-scanned textures (Poly Haven, CC0) and more detailed models from the start. The experiment's code is kept as bed/body.js.look-experiment if ever wanted.

## Delivery rules
- **Artifact:** embed the models in the page as base64 `<script type="application/octet-stream">` tags. Decode with the tolerant decoder (never atob()) and check each starts with "glTF". **Do not load models as separate files next to an artifact.** The viewer doesn't serve them, and that broke the game twice.
- **Netlify:** models as plain .glb files next to index.html, fetched with fetch(). Build from the same source; test this build separately, because it has its own loader code.
- **Shrink models** with gltf-transform `dedup` then `weld`. Avoid `quantize`.
- **Changing how the page loads breaks tabs that are already open.** Tell players to open the newest card or hard-reload (Ctrl+Shift+R).

## Testing rules
- **Test what the player sees, not just the game state.** Screenshot every key clue from where a player would stand.
- **Run a reach test:** every clue must be examinable from a spot the player can walk to.
- **Tests click buttons,** not only press keys.
- **Take before and after screenshots** for any lighting or look change.
- **When replacing a big block of code,** re-check every event handler that lived in it.

## Cost habits
- **One milestone per session.** Paste the brief and attach only the files that step needs.
- **Effort:** High for building, Low or Medium for tweaks.
- **Batch your playtest notes** into one message instead of sending one bug at a time.
