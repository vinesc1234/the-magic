GAME BRIEF: The Magic

Source IP: "A Little Princess" by Frances Hodgson Burnett (1905), public domain. The novel only (Project Gutenberg #146): no look, lines or music from any film or stage version. All dialogue is original.
One-line pitch: A dark fairy tale. As Sara Crewe, grieving, starving and alone in Miss Minchin's attic, find out who has been coming in at night while she sleeps, as her grip on what is real slips. The dread is real; so, in the end, is the kindness.
Platform: single-page browser game, desktop and phone, generated sound
Tech: Three.js 0.160, the Speckled Band engine (src/game.js, src/page.html, tools/build.py). Models from Claude Design (docs/design-prompts.md).
- Artifact version: models embedded as base64 <script type="application/octet-stream" id="glb-..."> tags, decoded with decodeBase64 (never atob), each checked for "glTF".
- Netlify version: models/<name>.glb fetched. Same source, its own loader; test it separately.
- The model list lives in one place: `const MODELS = [...]` in src/game.js. tools/build.py reads it.
- Repo: the-magic (local: C:\Users\vines\Projects\the-magic). Netlify builds from it once linked; no zips.

STATUS: Milestone 1 (the shell) DONE, rebuilt to follow the book's geography (see "Changed from the plan"). No models yet: furniture is code-built stand-ins on the footprints the Design prompts ask for. Design prompts written for all seven models.
Next step: Milestone 2, the feel of the cold attic: carry the candle, the cold and the dark, the house's sounds, and the small things to do (see "Tone" and "Playing as Sara"). No Design work needed for it.

THE STORY THE PLAYER IS REACHING (all from the novel)
Ram Dass, the Indian gentleman's servant, lives in the attic next door. Sara met him once, when his monkey ran across the slates into her attic and she spoke to him in Hindustani. He watches her from his skylight and has told his sick master about her. Together with the master's young secretary he looked over her attic while she was out, and on the night of the spoiled feast he crept in with a dark lantern while she slept, the secretary handing things through the skylight. Sara can work out who, how and why. She cannot work out that Mr. Carrisford is searching for her: that is the ending's job.

Player role: Sara, first person, no player model. She is eleven: eye height 1.38 m (the kit's default is 1.72 m, Holmes's).
Controls: as The Speckled Band. Click to capture the mouse (Esc frees it; drag also works), arrows turn, WASD walk, E examine / use. On the table you can only look around. Phone: left stick, drag to look, tap the prompt.
Mood: cold, then warm. The cold half is the control group: the player must have looked at the bare room for the change to mean anything.

TONE: A DARK FAIRY TALE (user decision, Oct 22: "the Coraline, Pan's Labyrinth vibe")
The book is already dark: an eleven-year-old whose father has just died, starved and punished, sleeping in a freezing attic with the rats, surviving by "supposing" ("I am dreaming yet"). The game plays the night as a child would feel it: someone is coming into your room while you sleep. Real dread, no gore. Mostly slow, creeping unease; at most one or two startling moments in the whole game. For teenagers and up.
- The ending is the book's, played straight: it was Ram Dass, out of pity, and the warmth is real. The fear makes the warmth land.
- THE MENACE IS MISS MINCHIN, never seen whole: footsteps on the stairs, her voice coming up through the floor, a line of candlelight under the door that stops outside it and waits, the house itself (doors that were shut, standing open). Hunger, cold and grief are the other horrors.
- RAM DASS IS NEVER THE MONSTER. He is frightening only while unknown: sounds on the slates, a lantern glimmer, a whisper. When seen, he is gentle, and his reveal is the warmth. A horror game whose stranger in the dark turns out to be its one Indian character must not lean on that old trope: his look, his music and his sounds are never made sinister.
- BECKY IS SARA'S COMFORT and must never be frightening. When reality slips, Becky (her knock on the wall, her voice) pulls it back. People are seen at a few steps, alive (blinking, breathing, looking at you), never in a close-up 3D face; conversations show a Victorian cut-paper silhouette portrait on the card.
- THE BLENDING: reality slips when Sara is cold, in the dark, hungry or afraid, and steadies near light, warmth and Becky. Never a fail state; it only changes what she sees and hears. Small and deniable at first: Emily's head turned when you look back; the room a little longer than it was; a wall that seems to breathe; whispers under the wind; the card paper staining at its edges; the sparkles flickering out; the plum night going bruised. Stronger as the night goes on, gone in the morning.
- SUPPOSING can go wrong when the blending is strong: the imagined fire burns cold and blue, the imagined feast is ashes. What she supposes calmly comes true in the morning; what came out wrong does not.
- SOUND comes early (milestone 2), because dread is mostly sound: the house settling, wind in the chimney, scratching in the walls, slates ticking as something crosses them, and silence used on purpose.
- The look stays the storybook (fonts, paper, sparkles); the horror is that the whimsy cracks, then mends.

PLAYING AS SARA: WHAT MAKES THIS MORE THAN THE SPECKLED BAND (user decision, Oct 21)
Holmes observes; Sara lives in the room. The Speckled Band's loop (walk, point, read a card) stays, but the player also does what Sara does in the book.
1. SUPPOSE: imagine the room, and it comes true. The heart of the game. Ram Dass: "Being sad one night, I lay close to the open skylight and listened. The vision she related told what this miserable room might be if it had comforts in it." In the cold half, at certain spots (the grate, the bare boards, the bed, the table, the bare wall) the player can suppose: Sara's line plays and a faint, dreamlike version of the thing appears there (the attic_warm piece, translucent and shimmering), then fades. Next morning exactly the things she supposed are really there, and the things she didn't suppose aren't. That is why every new piece in attic_warm is its own named object: unsupposed pieces stay hidden. The player must suppose at least three before Sara can sleep.
2. LIE STILL AND LISTEN: a timed "Don't move" challenge, like Until Dawn's (user decision, Oct 22). Book: "When Sara had stirred ever so faintly, Ram Dass had closed the lantern-slide and lain flat upon the floor." About 90 seconds in beats: the skylight creaks open (draught, slates ticking); someone lowers onto the table; the lantern beam sweeps the room and crosses her face (hardest); things are set down one by one; someone comes to the bed and leans over her (the peak, heartbeat loud); they climb out and the skylight clicks shut.
   Controls. Desktop: hold Space to keep her eyes shut and keep the mouse still: a small marker drifts with her breathing and the player's hand and must stay inside a circle that shrinks at the tense beats. Phone: hold a finger still on the screen; optional tilt-to-balance mode (device motion, needs a permission tap on iPhone).
   Peeking: let go of Space and her eyes open a crack, blurred through the lashes. That is how clue 7 is gathered: the lantern glow, a white sleeve, a slim brown hand setting down a cup, a whisper in Hindustani. Peeking while the beam is on her makes her stir.
   Stirring: the light snaps off and the room goes silent; a long pause, then it resumes, and that glimpse is lost. Each stir makes him more cautious: fewer things are set down, so fewer of the supposed things are there in the morning. A third stir and he leaves early. Never a game over: only a poorer morning and fewer glimpses. The whisper is always heard, so the deduction stays possible.
   The twist: at the peak he is tucking the new warm quilt around her (the book's "new warm coverings"). Peek then and the most frightening moment is the tenderest. Nothing glimpsed is ever monstrous: the dread is only in not knowing.
   Accessibility: settings for a larger circle and for holding still automatically.
3. CARRY THE CANDLE. Sara holds her candle-end, seen in the bottom of the view. It lights only what is near her, so dark corners have to be visited and clues are found by bringing the light to them. It burns down slowly through the evening as a gentle clock (it gutters lower, never a game over). She sets it on the table when she climbs up, and picks it up again.
4. SMALL THINGS TO DO. Knock on the wall and Becky knocks back ("the prisoner in the next cell"). Leave crumbs by the skirting and Melchisedec comes out. Sit on the red footstool with Emily (the view lowers). The cold is felt: breath fogging in the candlelight, frost creeping in at the edges of the view the longer she is away from a flame, easing near it. In the warm state the frost is gone.
5. ANSWER MISS MINCHIN, ON A TIMER (user decision, Oct 22). Her footsteps climb the stairs and stop outside the door; the line of candlelight under it waits. She speaks through the door ("Sara. Are you awake?" and worse). A few seconds to choose: answer politely, answer back, or say nothing (the timer running out is silence, and silence is a choice). In the book Sara's polite composure maddens her more than defiance would. Each answer changes what she says and what she takes: the candle-end, the crumbs, Emily for the night. Her face is never shown. Two or three such moments in the evening.
6. THE KNOCKING CODE, AND THE WRONG WALL (user decision, Oct 22). Book: Sara knocks on the wall "for the prisoner in the next cell" and Becky comes. Early in the evening it is a small rhythm game: knock a pattern on the shared wall, Becky knocks it back, and her answer steadies the blending. Late in the night, when the blending is strong, the answer comes from the other wall, the one with nothing behind it. Teach something safe, then break it.
7. SPOT WHAT CHANGED (user decision, Oct 22). All night, small things change when the player looks away: Emily's head turned, the footstool moved, one candle-end too many, the bed made when she never made it. Noticing is half the dread, and it trains the eye: in the morning, the warm room's clues are gathered by spotting what is new, and the same habit finds them. Each change noticed in the night goes in My book; none are needed to finish.
Not chosen (Oct 22): a monkey-chase minigame (the ending still opens with the monkey, as in the book), a "Because of you" page, her father's letters.
Left out on purpose: calling the sparrows (the book's sparrows come at sunset; this is night).
Timing liberty: in the book, Ram Dass overheard her on an earlier night and the magic came days later. The game compresses it into one evening, one night and one morning. The README lists this.

CHANGED FROM THE PLAN (and why)
- No lit window across a gap. The plan put Carrisford in a lit window opposite, watching. The novel has the Indian gentleman's house next door in the same row, and Ram Dass's attic "a few yards" along the slates from Sara's. The outside was rebuilt to match (user decision, Oct 21).
- Sara climbs onto the old table to look out of the skylight, as in the book. From the floor it shows "nothing but an oblong piece of dull gray sky".
- Furniture follows the book: an old iron bedstead, an old table under the skylight, the battered red footstool. Not a mattress on the boards and a stool.
- Clues 2, 3 and 5 changed to things the book supports (two men came, one with soft feet; his parcels were "in readiness in the attic which was his own"; he used a dark lantern). The monkey is not in the attic on that night, so no monkey prints.
- No skylight.glb: the skylight is cut through the code-built roof, and its catch (clue 1) is built in code, raised and bright. Seven models, not eight.
- The stairhead is not a walkable space: the two attic doors take you straight between the attics (fade), as The Speckled Band's doors did.

LAYOUT (metres; -z is the front of the roof; Y up)
- Sara's attic at world origin: floor x -1.5..1.5, z -1.8..1.8. Ceiling slopes from 1.4 m at z -1.8 (the eaves end) to 3.0 m at z 1.8. You can't walk where the ceiling is below 1.5 m.
- Skylight (all three attics, in each attic's own frame): x -0.4..0.4, under the slope from z -1.70 to -0.85. Glass in an iron sash hinged along its top. Sara's opens (thrown right back) while she is on the table or out on the leads.
- Becky's attic: group at x 2.92, floor x -1.3..1.3 local. Door at local x -0.65. Sara's door at x 0.85. Both in the back wall.
- Ram Dass's attic: group at x -3.12, same size as Sara's. Not walkable. Its skylight is propped open (sash at 1.0 rad). Inside, against its far wall: parcels in brown paper and string, a dark lantern on them (lit), and a crimson rug rolled and stood on end at local (-1.25, -0.45).
- The leads: a flat lead walk at y 1.15, z -2.0..-4.0, behind a 0.45 m parapet. Walkable from the party wall (x -1.62) to Becky's far wall (x 4.34). The party wall between the two houses crosses the leads as a 0.62 m wall and runs up the slates as a low brick course, so Sara sees along the roof to his skylight but can't walk over.
- The square: street at y -10, the terrace across it at z -26, a few windows lit.
- Old table under Sara's skylight: x -0.375..0.375, z -1.45..-0.95, 0.68 m high. On it, the candle-end at (0.26, -1.04). Standing on it: eye 2.06 m, head and shoulders out of the skylight.
- Iron bedstead x -1.5..-0.6, z -0.95..0.95, head at +z. Red footstool at (0.62, -1.0). Cold grate in the back wall at x -0.7. Becky's bedstead local x 0.4..1.3.
- Arrivals: start at (0.6, 0.55) facing the table and skylight; on the table facing west along the slates; on the leads at (0, -2.42) facing his lit skylight.

SIGHTLINES (measured by tools/test/shots.js on every run; it fails if these break)
- From the table: 75% of next door's propped glass in clear view.
- From the floor of Sara's attic: 0 of 190 standing spots see any of it. Only sky, as in the book.
- From the leads: 21 of 370 standing spots see at least a quarter of the rolled rug inside his attic (best 50%). They are the spots by the party wall, nearest his skylight, which is where a player goes to look.

LOOK (its own, not The Speckled Band's: an Edwardian storybook read by candlelight, a little feminine, a little whimsical)
Fonts: Pinyon Script for the title only; Fraunces at its softest ("SOFT" 100, "WONK" 1), mostly italic, for headings, prompts and place names; EB Garamond for reading. Palette: plum-indigo night #15112a, cream paper #f7efe4 with a blush edge #e6cfc3, plum ink #3b2a3f, candle gold #e9bb6c, dusty rose #c98a9c, moonlight lavender #c7c0ec. Rounded panels (14-20 px), pill buttons, a double hairline (cream and rose) inside every paper panel, a small gold sparkle at the top of each card. The aiming point is a four-point star that turns gold and rotates over something usable. Title screen: twinkling stars, a sparkle flourish under the title. In the world: the night and the moonlight are lavender rather than steel blue, the highlight glow is candle gold (#f0bf78). The notebook is "My book"; the deduction button is "Work it out". Whimsy stays small and quiet; the cold is still cold.

LIGHTING
Cold is the default: hemisphere light low and blue, no ceiling fill, one candle-end (intensity 0.9, range 2.6, decay 2) and the moon. One shadowed moon lights the roofs and comes into each attic only through its skylight, as a pale patch on the boards. The only warm light outside is next door's lantern, kept short-ranged and set deep in his attic, because lights without shadows pass through walls (a long-range lamp lit the brick outside it). The warm state will restore a fill and add the fire. Before-and-after screenshots for every lighting change.

CLUE TABLE (seven key clues: three in the cold evening, one in the night, three in the morning; every one gets an empty notebook slot naming where it is)
| # | Clue | Where | State | Exactly where, and how it stands out |
|---|---|---|---|---|
| 1 | The skylight catch | Your attic | before | On the inside of the skylight's lower edge, centre, about (0, 1.47, -1.68). Rusted everywhere except one bright scraped arc: it has been worked from outside. Built in code, raised 3 cm, bright metal on the dark frame, with a small cold light on it. Seen from the floor, examined from the table |
| 2 | Prints on the leads | The leads | before | On the lead below your skylight, x -1.4..0, z -2.1..-2.6, coming from the party wall. Two sets in the damp: a man's boots, and narrow soft prints with no heel ("I can move as if my feet were of velvet"). Pale on dark lead, in moonlight |
| 3 | The light next door | From the table, and the leads | before | His skylight propped open and lit; from the leads by the party wall, the parcels in string and the rolled crimson rug. Examinable from both places |
| 4 | It is what I supposed | Your attic | after | Everything she imagined aloud is here, and nothing she didn't. The rug (thick crimson, a border from India, x -0.55..0.65, z 0.3..1.2) is the same one that stood rolled in his attic |
| 5 | Lamp oil on the table | Your attic | after | Two or three drops of oil and a pale ring on the old table under the skylight, where a lantern was stood. This house has nothing but candle-ends. Raised 1 cm, with a proxy hit box |
| 6 | Becky's room is untouched | Becky's attic | after | The same cold, the same bare bedstead. Whoever came, came for you |
| 7 | What I saw in the night | Your attic | night | Gathered during "Lie still and listen": a lantern light, a white sleeve, things handed down through the skylight, a whisper in Hindustani. Filled in automatically from what the player actually glimpsed |
Non-key examinables: Emily on the bed, the red footstool, Melchisedec's hole in the skirting, frost on the inside of the glass, the candle-end, the cold grate, the nails in the walls (the secretary was pleased by them: "You can hang things on them"), the knock on the wall to Becky.

THE DEDUCTION (unlocks once all seven are in the notebook)
1. Who has been in this room? The Lascar from the attic next door, and someone with him. Proved by 7, 2, 3.
2. How did they get in? Across the slates and down through the skylight onto the table. Proved by 1, 2, 5.
3. How did they know what you wished for? He was listening at the skylight while you supposed, and it was you, not Becky, he came for. Proved by 4, 6, 1.
A fact in the notebook from the start: the Lascar next door and his monkey (chapter 11).

CHARACTERS
- Becky: fourteen, "so stunted in growth that she looked about twelve", the scullery maid. In the attic next to Sara's; Sara knocks on the wall for her.
- Ram Dass: the Indian gentleman's servant, "white-swathed", white turban. Speaks with Sara late in the game.
- The monkey: small, impish, "small black face".
- Mr. Carrisford: "a haggard, distressed face, and a skeleton body wrapped in furs". Seen only at the ending.
- Melchisedec: the attic rat. Comes out for crumbs.

MODELS (prompts: docs/design-prompts.md; none received yet)
becky, candle, grate, attic_cold, attic_warm, next_door, becky_attic, ram_dass, monkey, carrisford, melchisedec (eleven; Melchisedec is needed for the crumbs). Order and reasons at the top of docs/design-prompts.md. Ask for each back with a screenshot. Check each in game before building on it: size, origin, part names, and how it reads from 1.38 m.

BUILD ORDER (one milestone per session; playtest with screenshots after each)
1. The shell. DONE.
2. The feel of the cold attic: carry the candle (light in hand, burning down, set down on the table), the cold and the dark, the house's sounds, sitting on the footstool, crumbs for Melchisedec (a stand-in until his model), and the knocking code with Becky (the safe version). NEXT.
3. Cold clues 1, 2, 3 with glow and cards, found by candlelight, and "My book" with seven empty slots.
4. Miss Minchin: footsteps on the stairs, the light under the door, her voice through it, and the timed answers with their consequences.
5. The blending: reality slipping and steadying, things that change when you look away (and noticing them), the knock from the wrong wall, the cracking look.
6. Suppose: the imagining spots, Sara's lines, the dreamlike overlays (and the ones that go wrong), remembering what was supposed. The gate to sleep.
7. Lie still and listen: the timed "Don't move" night visit.
8. The turn: morning, and the warm state built from what was supposed and what the stirring cost. The mood rests on it.
9. Morning clues 4, 5, 6 (found by spotting what is new), and clue 7 from the night.
10. Becky and Ram Dass: dialogue with silhouette portraits, topics, facts; people alive at a few steps.
11. The deduction.
12. The ending.
13. Intro cutscene, sound polish, phone controls, accessibility settings.
Playing time grows to about 20 to 30 minutes.

TESTING
- node tools/test/smoke.js <url>: loads, starts, fails on any error.
- node tools/test/shots.js <url> <folder>: ten standing-height views, three top-downs, the sightlines above, and every way between rooms by pressing E (doors both ways; onto the table, out, back in, down; and that the skylight can't be climbed through from the floor).
- Headless Chromium needs --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader and runs about 1 frame a second.
