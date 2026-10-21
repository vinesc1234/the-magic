# The Speckled Band: realistic-look prompts for Claude Design

The second pass of models (Oct 16-17, 2026): "a gamified version of something real". Every model shares the same STYLE block so they all match. The first, simpler set of prompts is in the Claude project (claude/speckled-band-design-prompts.md).

## Shared style block (paste into every prompt)

```
STYLE: stylized realism, like a high-quality animated film: real-world
proportions and believable detail, but slightly simplified and smoothed.
Not a photo, not a cartoon, not chunky or toy-like. Smooth shading, no
outlines, soft worn edges. Period-accurate for an English country house,
1883.
```

## What we learned

- **Test the riskiest model first.** People are the hard part. We made Helen first. If her face hadn't worked, there would have been no point redoing the furniture.
- **Design ignores requests to put joints at the neck, shoulders and elbows.** Every joint comes back at the feet. `fixJoints()` in `src/game.js` fixes this in code, so keep the request in the prompt anyway, but don't spend a fix round on it.
- **Faces top out around "believable at talking distance".** One fix round improved the lips and the nose bridge. Design ignored the second-round asks (the grey streak, the veil), so stop after one round.
- **Exact coordinates work.** Giving each piece of furniture its footprint in metres landed everything within 1 cm of the old layout. Colliders, candles and clue spots needed no changes.
- **Keep the code-built ventilator grille.** The modelled one read as a blank frame from across the room.

## Helen Stoner (helen.glb)

```
Make a 3D model of a character for a browser game.

WHAT: Helen Stoner from "The Adventure of the Speckled Band" (1883): a woman
of about 30, frightened and exhausted, but composed. Plain black mourning
dress, a black veil pushed back off her face, dark brown hair pinned up in a
low bun with an early streak of grey at the front.
STYLE: [shared style block]
FACE: believable adult face with a defined nose, brows, lips, cheekbones and
jaw; eyes only slightly larger than real; tired shadows under the eyes;
worried expression (brows slightly raised and drawn together). No doll face.
BODY AND CLOTHES: real adult proportions, about 7.5 heads tall. A fitted
1880s bodice with a row of small buttons down the front, a high white collar,
long sleeves with white cuffs, a full skirt to the floor with soft vertical
folds and a slight bustle at the back. The veil hangs down her back.
HANDS: shaped hands with the fingers together (not separate fingers), relaxed
and slightly open.
SIZE: 165 cm tall, real scale
ORIENTATION: Y is up, front faces +Z, feet on Y = 0, centered on X and Z
POSE: standing upright, arms hanging slightly away from the skirt, not
touching it

SEPARATE NAMED PARTS (each its own object, keep these exact names):
- head: head, face, hair and veil - pivot at the base of the neck
- eye_left, eye_right: each visible eye (white and iris) - pivot at its
  centre so it can blink
- arm_left, arm_right: upper arms - pivot at the shoulder
- arm_left_forearm, arm_right_forearm: forearm and hand, children of the
  upper arms - pivot at the elbow
- body: torso, bodice, collar and skirt

COLORS (one named material each):
- dress_black: #1E1A1C, skin: #E8C9B0, hair_brown: #4A3424,
  hair_grey: #A8A39A, veil_black: #141214, collar_white: #D9D2C3,
  button_jet: #0E0D0F

DETAIL BUDGET: up to 25,000 triangles. Spend them on the face, hands and the
folds of the skirt.
DO NOT INCLUDE: ground, background, text, lights, camera
EXPORT: GLB, every part and material named as above
```

Fix round used:

```
Keep everything about Helen exactly as it is, except these fixes:
1. Nose: give it a clear, defined shape - a bridge, a rounded tip and two
   small nostrils - instead of a soft smudge.
2. Mouth: two distinct lips with a visible line between them, closed,
   corners turned very slightly down. Not blurred.
3. Grey streak: make it a lock of hair with the same shape and thickness as
   the hair around it, just grey - not a flat painted stripe.
4. Veil: soft fabric that drapes over the back of her head and falls in a
   few folds to her shoulder blades - not a flat panel.
5. Joints: set the pivot (origin) of head at the base of the neck, arm_left
   and arm_right at the shoulders, and the two forearms at the elbows.
Change nothing else. Keep all part and material names.
```

## Dr. Grimesby Roylott (grimesby.glb)

```
Make a 3D model of a character for a browser game.

WHAT: Dr. Grimesby Roylott from "The Adventure of the Speckled Band" (1883),
about 60: a huge, broad-shouldered man who fills a doorway. A large face,
deeply wrinkled and tanned yellow-brown by years in India, deep-set
bloodshot angry eyes, a thin high hooked nose, heavy brows, short grey
side-whiskers. Black top hat, long black frock coat, high brown leather
gaiters over his boots, a hunting crop in his right hand.
STYLE: [shared style block]
FACE: believable older man with a defined nose and nostrils, two distinct
lips pressed thin, deep lines across the forehead and around the mouth, a
heavy jaw. Expression: furious, brows drawn down. Not a monster.
BODY AND CLOTHES: real adult proportions, very large and heavy-set. The
frock coat reaches his knees, with lapels, a row of buttons and pockets;
a white shirt collar and dark cravat at the neck; trousers tucked into the
gaiters; shaped hands with the fingers together.
SIZE: 190 cm tall to the top of his head (hat extra), shoulders 60 cm wide
ORIENTATION: Y is up, front faces +Z, feet on Y = 0, centered on X and Z
POSE: standing square, feet apart, left arm at his side, right arm slightly
raised and bent, gripping the hunting crop

SEPARATE NAMED PARTS (keep these exact names; put each part's origin at
its joint):
- head: head, face and whiskers - origin at the base of the neck
- hat_crown, hat_brim, hat_brim_curl, hat_band: the top hat in four pieces,
  children of head
- eye_left, eye_right: each visible eye - origin at its centre
- arm_left: whole left arm and hand - origin at the shoulder
- arm_right: right upper arm - origin at the shoulder
- elbow_right: right forearm, hand and hunting crop, child of arm_right -
  origin at the elbow
- body: torso, coat and collar
- leg_left, leg_right: each a group with origin at the hip, containing
  thigh_left / thigh_right (hip to knee) plus the shin, gaiter and boot

COLORS (one named material each):
- coat_black: #18161A, hat_black: #101012, skin_tan: #B88A52,
  shirt_white: #D9D2C3, gaiter_brown: #4A3424, crop_leather: #5A3A26,
  beard_grey: #8A857C

DETAIL BUDGET: up to 25,000 triangles. Spend them on the face, hands and
the coat.
DO NOT INCLUDE: ground, background, door frame, text, lights, camera
EXPORT: GLB, every part and material named as above
```

He came out leaner than "fills a doorway". If wanted: "make him 15% broader across the shoulders and chest. Change nothing else."

## Julia's bedroom (bedroom.glb)

```
Make a 3D model set for a browser game.

WHAT: the furniture of Julia Stoner's bedroom, an English country house,
1883, from "The Adventure of the Speckled Band". Furniture only: no walls,
floor, ceiling, window, door or fireplace.
STYLE: [shared style block]
SIZE: real-world scale in metres
ORIENTATION: Y is up, everything stands on Y = 0. The room is 4.1 m wide
(X from -2.05 to 2.05) and 4.5 m deep (Z from -2.25 to 2.25). The back wall
is at Z = -2.25. Place each piece EXACTLY where listed.

SEPARATE NAMED PARTS (keep these exact names):
- bed: single bed, head against the back wall, centred on X = 0, footprint
  X -0.48 to 0.48, Z -2.24 to -0.28. Turned oak posts with ball finials,
  panelled head- and footboard, a mattress with rounded edges, a counterpane
  hanging 20 cm down the sides with soft folds, a turned-back sheet.
- bed_pillow: a soft rectangular pillow, plump in the middle, thin at the
  edges. Not a stretched sphere.
- bed_clamps: four iron clamps bolting the bed legs to the floor, with
  round bolt heads, clearly visible from standing height.
- rope_hook: a small brass hook on the back wall at X = 0.18, Y = 2.4
- bell_rope: a thick braided rope with a tassel, 1.6 m long, hanging from
  the hook so the tassel rests on the pillow. Origin at its TOP end.
- ventilator: a small iron grille, 30 cm x 20 cm, on the back wall centred
  at X = 0.45, Y = 2.4, its frame raised 3 cm from the wall and lighter than
  the wallpaper would be.
- chest_of_drawers: against the left wall, facing +X, footprint X -2.05 to
  -1.47, Z -0.16 to 0.86, exactly 1.0 m tall with a flat top. Five drawers
  with brass knobs, a moulded top edge, bracket feet.
- chest_drawer_1a: the top-left drawer as its own object, so it can slide
  out toward +X
- dressing_table: against the right wall, facing -X, footprint X 1.50 to
  2.05, Z -1.06 to -0.04, tabletop at exactly 0.76 m high, turned legs, an
  oval mirror on a tilting stand.
- dressing_table_drawer: its front drawer as its own object, sliding toward
  -X
- wicker_chair: a small woven-cane armchair, 48 cm x 48 cm, with real
  woven texture modelled in its shape and colour
- rug: a worn patterned Wilton carpet, 2.2 m x 2.8 m, 1 cm thick, centred
  on X = 0, Z = 0.3, with a border and a faded pattern

COLORS (one named material each; small colour variations within a part are
fine where the real thing would have them):
- dark_oak: #3B2A1E, counterpane_white: #D9D2C3, iron: #3A3A3C,
  brass: #B08A45, rope_red: #8E2A2A, wicker: #A8875A, rug_green: #2E3B32,
  mirror_glass: #9AA4A8

DETAIL BUDGET: up to 60,000 triangles for the whole set.
DO NOT INCLUDE: walls, floor, ceiling, window, door, fireplace, lights,
camera, text, background
EXPORT: GLB, every part and material named as above
```

## Dr. Roylott's room (roylott.glb)

```
Make a 3D model set for a browser game.

WHAT: the furniture of Dr. Grimesby Roylott's bedroom, an English country
house, 1883, from "The Adventure of the Speckled Band": a plain, bare room
for a man who spends nothing on comfort. Furniture only: no walls, floor,
ceiling, window or door.
STYLE: [shared style block]
SIZE: real-world scale in metres
ORIENTATION: Y is up, everything stands on Y = 0. The room is 4.5 m x 4.5 m
(X and Z from -2.25 to 2.25). The shared wall with the next bedroom is at
Z = -2.25. Place each piece EXACTLY where listed.

SEPARATE NAMED PARTS (keep these exact names):
- camp_bed: a low army camp bed (folding wooden frame, canvas stretched
  tight, one thin grey blanket), footprint X -2.25 to -1.30, Z -2.25 to
  -0.20
- dog_lash: a short leather dog whip whose end is tied into a small loop,
  hanging from the camp bed's corner at about X = -1.30, Z = -0.20, the
  loop 20 cm above the floor
- armchair: a worn button-backed leather armchair facing +X, footprint
  X -2.25 to -1.19, Z 0.06 to 1.04, with creases in the leather
- round_table: a small round pedestal table, 60 cm across, centred at
  X = -0.75, Z = 1.05, top at exactly 0.72 m high
- wooden_chair: a plain kitchen chair with its back to the shared wall,
  footprint X 0.12 to 0.58, Z -2.24 to -1.69, seat at 0.47 m high
- chair_seat: the chair's seat as its own object, scuffed by boot marks
- safe_body: a heavy iron safe, 0.7 m wide x 1.0 m tall x 0.65 m deep,
  footprint X 1.00 to 1.70, Z -2.24 to -1.59, with riveted edges and a
  brass maker's plate
- safe_door: the safe's front door (facing +Z) as its own object, with a
  handle and keyhole. Origin on its LEFT hinge edge so it swings open.
- saucer_of_milk: a small white saucer of milk on top of the safe
- bookshelf: a low open bookshelf against the right wall, facing -X,
  footprint X 1.90 to 2.25, Z 0.03 to 1.07, exactly 0.9 m tall with a flat
  top, holding rows of worn technical books, some leaning
- ventilator_back: a small iron grille, 30 cm x 20 cm, on the shared wall
  centred at X = 0.35, Y = 2.4, directly above the chair, its frame raised
  3 cm from the wall

COLORS (one named material each; small colour variations within a part are
fine where the real thing would have them):
- dark_oak: #3B2A1E, iron: #3A3A3C, brass: #B08A45, leather_brown: #5A3A26,
  canvas_grey: #6B655A, milk_white: #E6DCC4, book_red: #8E2A2A,
  book_green: #2E3B32

DETAIL BUDGET: up to 60,000 triangles for the whole set.
DO NOT INCLUDE: walls, floor, ceiling, window, door, lights, camera, text,
background
EXPORT: GLB, every part and material named as above
```

Still to come: candle, swamp adder, Holmes's cane.
