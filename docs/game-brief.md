GAME BRIEF: The Speckled Band

Source IP: "The Adventure of the Speckled Band" by Arthur Conan Doyle (1892), public domain in the US. Use only the original story; no look, lines or music from modern adaptations.
One-line pitch: As Sherlock Holmes, search two rooms at Stoke Moran, confront the people involved with your evidence, name the killer's method, then keep watch in the dark for the final moment.
Platform: single-page browser game, desktop and phone
Tech: Three.js 0.160. Source (without models) is about 110 KB; the 7 models are made in Claude Design.
- Artifact version: models embedded in the page as base64 <script type="application/octet-stream" id="glb-..."> tags (page about 11 MB). Decoded with the page's own tolerant base64 decoder, never atob(); each must start with "glTF". Build: bed/build.py (head.part + body.js = src.html, then embed). Separate models/*.txt files next to the artifact were tried on Oct 13 and FAILED in the viewer ("incomplete model", then 404s): don't do that again.
- Netlify version: models/<name>.glb fetched directly (see claude/speckled-band-netlify.md). Built from the same source by netbuild.py; test it separately.
- Shrink each GLB losslessly first with gltf-transform `dedup` then `weld`. Don't use `quantize` without re-checking positions.
- Loading shows "Loading the house… n of 7"; any failure shows "Reload the game".

STATUS: Steps 1-7 DONE plus the prologue cutscene. Playable start to finish. On Oct 13: visible ventilator grilles built in code (the model's was flush and invisible), brighter lighting (exposure 1.4, ambient 1.2, ceiling fill per room, off at night and in the prologue). Added to the portfolio site. Remaining: step 8 (in-game sound and phone polish).

Player role: Holmes (first person, no player model)
Controls: click the room to capture the mouse, then move the mouse to look (Esc frees it; click-and-drag also works). Left/Right arrows turn. WASD walk. E examine / talk / use doors / close cards. Conversations: number keys pick, Esc leaves. Tab or the Notebook button. "Make the deduction" button appears once unlocked. Night watch: E, Space, Enter, a click, or tapping the prompt strikes the rope. Prologue: Esc or the Skip button. Phone: left stick, drag to look, tap buttons.
Mouse-look note: ignore the first 2 mouse moves after capture and any single move over 150 px.
Camera: first person, eye height 1.72 m (1.25 m seated during the night watch)

NOTEBOOK: fixed-position panel (it was once invisible behind the canvas for lack of position: fixed). Lists all 7 key evidence slots from the start: found ones show Holmes's full note, unfound ones say "Not yet found · somewhere in <room>". Then "Notes and testimony" as bullets.

START SCREENS AND PROLOGUE
- Loading, then first visit: "A Sherlock Holmes mystery / Best with the sound on", Begin (plays the prologue; the click unlocks sound) and "Skip the prologue". Later visits (localStorage speckled-prologue-seen) go straight to the story screen with a "Watch the prologue" link.
- Prologue (~36 s, in-engine, letterboxed, HUD hidden via body.cinematic): captions, Julia's room by night, rain, wind, lightning and thunder, camera to the bed and up the bell-rope, a low whistle, the snake's head at the grille with a hiss, a scream, black, "Helen! It was the band! The speckled band!", the title. CUT_KEYS / tickCutscene; endCutscene restores everything.
- Generated Web Audio (sfx): startStorm/stopStorm, thunder, whistle, hiss, scream. Reuse for step 8.

STORY FLOW AS BUILT
1. Julia's bedroom: key clues bell_rope, ventilator, bed; notes window, chimney, chest, dressing.
2. Door (fade) to Dr. Roylott's room: key clues safe, saucer, lash, chair; notes vent_back, camp_bed, books.
3. Notebook (above).
4. Helen: ask about the night / Dr. Roylott; show evidence. Testimony: whistle, last_words, motive, clang, cigars.
5. Roylott storms in (after Helen's account or 5+ key clues); testimony: animals; parting threat.
6. Deduction: who / how / why with hints; solution card.
7. Night watch and ending (snake down the rope, timed strike, retry on a miss, final tableau, The End screen).
Easy-to-miss clues: the dog lash (low, on the corner of the camp bed; "lash" is Doyle's word for a whip, players may read it as "leash") and the saucer (on top of the safe).

CONVERSATIONS: SPEAKERS table. DEDUCTION: DQ table; proof: who = ventilator or vent_back; how = bell_rope, ventilator, bed, saucer, lash, chair; why = motive; WHERE table gives place hints.

Art style: moody Victorian, stylized, soft-shaped. No outlines. Objects glow amber when targeted; people never glow.
Palette: #2E3B32, #3B2A1E, #E8A64A, #6E86A8, #8E2A2A, #E6DCC4. Fonts: IM Fell English SC, IM Fell English italic, Crimson Pro.
Scale: 1 unit = 1 metre; Y up; models face +Z

LAYOUT
- Julia's bedroom at world origin, x -2.05..2.05, z -2.252..2.25; door at x 1.15. Ventilator centre (0.45, 2.4, -2.24); rope hook (0.18, 2.4, -2.08).
- Dr. Roylott's room: group at (0.80, 0, -4.622) rotated 180 degrees, 4.5 x 4.5 m, 12 cm shared wall.
- Helen (-0.95, 0, 1.25) rot 2.1. Roylott enters at (1.15, 0, 2.0). Night seat (0.95, -1.15).

MODELS (all DONE). Prompts: claude/speckled-band-design-prompts.md
bedroom (pillow reshaped in code; ventilator hidden and replaced by a code-built grille), candle (x4), roylott (room; ventilator_back likewise replaced), helen (eyes re-pivoted), grimesby (Dr. Roylott; knees added for the seated ending), adder (6 chained segments; origin is mid-body, snout 0.5 m ahead), cane (rotate the whole model; its tip is a separate piece).

LESSONS FROM THIS BUILD (the full list for future games is in claude/indie-game-kit.md)
- Embed models in the artifact page; separate files next to an artifact don't load in the viewer.
- Small clue details must stand out from the wall and contrast with it.
- Light brighter than feels right, and give dark scenes a deliberate light on whatever the player must see.
- Test what the player sees, not just state: a panel can be "open" and still invisible.
- When replacing a big block of code, re-check every event handler that lived in it. Tests should click buttons, not only press keys.
- Check new models in-game for size and origin before positioning them.
- Tell the player what to look for (the notebook's empty slots), or they assume content is missing.

Game page: https://claude.ai/artifact/1ycAAjvhqEcbjGchW9qDRU
Source: claude/speckled-band-src.html

Next step: Step 8, in-game sound and phone polish (no Design work needed).
