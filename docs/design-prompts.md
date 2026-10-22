# The Magic: model prompts for Claude Design

One model per prompt. Paste a prompt into Claude Design as it is, export the GLB, and send it back
**with a screenshot**. Make them in this order: Becky first (people are the riskiest part, so find out
early whether the faces work), then the candle (milestone 2 needs it), the grate and the cold attic, then
the warm attic, the things next door (attach the warm attic's screenshot so the rug, chair and table
match), Becky's attic, Ram Dass, the monkey, Mr. Carrisford, and Melchisedec last (he comes out for crumbs, so he is needed).

Everything described here is from Burnett's 1905 novel (Project Gutenberg #146). Where a prompt quotes
the book, the quote is there so Design gets the period details right, not to be copied into the game.

## Shared style block (paste into every prompt where it says [shared style block])

```
STYLE: stylized realism with a storybook warmth, like a high-quality
animated film: real-world proportions and believable detail, gently
softened and rounded, as if lovingly hand-made. Not a photo, not a
cartoon, not chunky or toy-like. Smooth shading, no outlines, soft worn
edges. Period-accurate for a London town house, about 1890.
```

## What the code builds, so the models must not

The attic itself (whitewashed walls, sloped ceiling, bare boards, the skylight cut through the roof,
the rusty grate in the back wall, the door, the nails in the walls) is built in code, because the
skylight is a real hole you climb through and the light has to come in through it. The models are the
**things in the room**, placed by exact coordinates in the attic's own frame:

```
ATTIC FRAME (both attic prompts use it):
origin = the centre of the attic floor, Y up, metres in the code, cm below.
The floor runs X -150..150 cm and Z -180..180 cm.
-Z end: the low end, ceiling 140 cm high, the skylight above it
        (opening X -40..40, Z -170..-85).
+Z end: the high end, ceiling 300 cm. The door is in this wall at X +85,
        the grate at X -70.
-X: the wall on your right when you stand at the door and look toward
    the skylight. The bed goes against it.
```

**Exact coordinates work.** On The Speckled Band, giving each piece its footprint in metres landed
everything within 1 cm, and the colliders needed no changes.

**The skylight is not a model.** The plan listed `skylight.glb`, but the skylight is cut through the
code-built roof, and its catch (a key clue) will be built in code too, raised 3 cm and bright. The
Speckled Band's modelled ventilator read as a blank frame from across the room, while the code-built
one was found.

---

## 1. Becky (becky.glb): make this first

```
Make a 3D model of a character for a browser game.

WHAT: Becky, the scullery maid from "A Little Princess" (Frances Hodgson
Burnett, 1905). She is fourteen but "so stunted in growth that she looked
about twelve": small, thin, worn out, timid. She blacks boots and grates
and carries coal all day.
STYLE: [shared style block]
FACE: a believable young teenager's face, thin, with a defined nose, brows,
lips and jaw; eyes only slightly larger than real, wide and anxious; a
smudge of coal dust on one cheek and on the side of her nose. No doll face.
BODY AND CLOTHES: real proportions for a small, underfed 14-year-old, about
6.5 heads tall. A faded dark brown print frock to the ankles, sleeves
pushed up to the elbows, a coarse grey-white kitchen apron with grimy
patches, a crumpled white cap over untidy mouse-brown hair, heavy worn
black boots.
HANDS: shaped hands with the fingers together, red-knuckled, relaxed.
SIZE: 140 cm tall, real scale
ORIENTATION: Y is up, front faces +Z, feet on Y = 0, centred on X and Z
POSE: standing, shoulders a little hunched, arms hanging slightly away from
the skirt, not touching it

SEPARATE NAMED PARTS (each its own object, keep these exact names):
- head: head, face, hair and cap - pivot at the base of the neck
- eye_left, eye_right: each visible eye (white and iris) - pivot at its
  centre so it can blink
- arm_left, arm_right: upper arms - pivot at the shoulder
- arm_left_forearm, arm_right_forearm: forearm and hand, children of the
  upper arms - pivot at the elbow
- body: torso, frock, apron, legs and boots

COLORS (one named material each):
- frock_brown: #4A3A2E, apron_grey: #B9B2A4, cap_white: #D8D2C4,
  skin: #E6C3A8, hair_mouse: #7A6248, boots_black: #1C1816, soot: #2A2622

DETAIL BUDGET: up to 25,000 triangles. Spend them on the face, the hands
and the folds of the apron.
DO NOT INCLUDE: ground, background, text, lights, camera
EXPORT: GLB, every part and material named as above
```

## 2. The cold attic (attic_cold.glb)

```
Make a 3D model of a set of furniture for a browser game. The room's walls,
floor, ceiling, skylight and grate are built separately: model ONLY the
pieces listed, each at the exact position given.

WHAT: the attic of a girl who has been made a servant, in "A Little
Princess" (Burnett, 1905). The book: "a rusty grate, an old iron bedstead,
and a hard bed covered with a faded coverlet. Some pieces of furniture too
much worn to be used downstairs had been sent up. Under the skylight ...
there stood an old battered red footstool." She climbs on an old table to
put her head out of the skylight. Everything is cold, worn and poor.
STYLE: [shared style block]

ATTIC FRAME: origin = centre of the attic floor, Y up, units in cm.
The floor runs X -150..150, Z -180..180. The ceiling slopes from 140 cm
high at Z -180 to 300 cm at Z +180, so keep everything low at the -Z end.

PIECES (each its own named object, origin at the base of the piece,
positioned as given):
- bedstead: a narrow old iron bedstead, black paint chipped to rust,
  footprint X -150..-60, Z -95..95. Head rail (plain bars, 95 cm high)
  at Z +95, foot rail (60 cm high) at Z -95. Legs on the floor.
- mattress: thin, hard and lumpy, a rounded box with soft edges (not a
  stretched sphere), 88 x 188 cm, 10 cm thick, its top 48 cm above the
  floor, on the bedstead.
- coverlet: a faded, thin coverlet over the lower two thirds of the
  mattress, hanging 15 cm over the sides, worn through in one corner.
- pillow: small and flat, a rounded box 50 x 30 x 8 cm, at the head end.
- emily: Sara's doll, about 40 cm tall, sitting propped against the
  pillow, in a plain dark dress, real porcelain-doll proportions. Her
  own object so the game can move her.
- table: an old battered deal table under the skylight, top 75 x 50 cm,
  68 cm high, footprint X -37..37, Z -145..-95. One corner of the top
  split. Leave the top bare: a candle is added in code.
- footstool: an old battered red footstool, 36 x 26 cm, 20 cm high,
  lopsided (one leg shorter), the red worn through to the wood on the
  edges, at X 62, Z -100.

COLORS (one named material each):
- iron_black: #22201E, rust: #6B3A22, ticking_grey: #8B8F95,
  coverlet_faded: #6E6656, pillow_grey: #A8A49A, deal_wood: #8A7258,
  footstool_red: #7A2A26, doll_dress: #2A2830, doll_skin: #EAD6C6

DETAIL BUDGET: up to 20,000 triangles for the whole set.
DO NOT INCLUDE: walls, floor, ceiling, skylight, grate, door, candle,
ground, background, text, lights, camera
EXPORT: GLB, every object and material named as above
```

## 3. The warm attic (attic_warm.glb)

The swap has to read as *this room, changed*, so the old pieces stay exactly where they were. Every new
piece must be its own named object: the game shows only the pieces the player imagined the night before,
and the same pieces appear as faint dreamlike overlays while she is imagining them.

```
Make a 3D model of a set of furniture for a browser game. The room's walls,
floor, ceiling, skylight and grate are built separately: model ONLY the
pieces listed, each at the exact position given.

WHAT: the same attic after a secret kindness, from "A Little Princess"
(Burnett, 1905). The book: "on the hob was a little brass kettle hissing
and boiling; spread upon the floor was a thick, warm crimson rug; before
the fire a folding-chair, unfolded, and with cushions on it; by the chair a
small folding-table, unfolded, covered with a white cloth, and upon it
spread small covered dishes, a cup, a saucer, a teapot; on the bed were
new warm coverings and a satin-covered down quilt; at the foot a curious
wadded silk robe, a pair of quilted slippers, and some books ... a bright
lamp stood on the table covered with a rosy shade." The new things are
rich and come from the East; the old things are as poor as ever.
STYLE: [shared style block]

ATTIC FRAME: origin = centre of the attic floor, Y up, units in cm.
The floor runs X -150..150, Z -180..180. The grate is in the +Z wall,
centred at X -70; its opening faces -Z at Z 153.

UNCHANGED PIECES (identical to the cold set, same names, same places):
- bedstead: old iron bedstead, footprint X -150..-60, Z -95..95, head
  rail at Z +95
- mattress: 88 x 188 x 10 cm, top 48 cm above the floor
- emily: the doll, sitting against the pillow at the head end
- table: old deal table under the skylight, X -37..37, Z -145..-95,
  68 cm high, top bare
- footstool: battered red footstool at X 62, Z -100

NEW PIECES (each its own named object):
- quilt: a satin-covered down quilt, deep old gold, a rounded puffy box
  with quilted stitching (not a stretched sphere), over warm new blankets,
  covering the whole mattress and hanging 20 cm over the sides.
- robe: a wadded silk robe in crimson, folded at the foot of the bed.
- slippers: a pair of quilted slippers on the quilt beside the robe.
- books: three books stacked beside them.
- pillows: two big downy pillows at the head end, rounded boxes, Emily
  sitting against them.
- rug: a thick warm crimson rug with a deep border pattern from India
  (gold, indigo and ivory), 120 x 90 cm, 2 cm thick, centred X 5, Z 75.
- chair: a folding chair, unfolded, wooden frame, with two cushions
  (seat and back, rounded boxes), seat 42 cm high, standing on the rug at
  X -20, Z 80, turned so it faces the grate (rotate 35 degrees toward -X).
- side_table: a small folding table, unfolded, top 50 x 40 cm, 62 cm
  high, at X 38, Z 78, covered with a white cloth hanging 10 cm over the
  edges.
- dishes: on the side table, two small covered dishes with domed silver
  covers, a cup and saucer, a teapot.
- lamp: on the side table, a small brass oil lamp, 40 cm tall, with a
  rosy pink glass shade. The shade is its own object named lamp_shade so
  the game can make it glow.
- kettle: a little brass kettle, 18 cm across, its base at X -55, Y 30,
  Z 147 (it sits on the grate's hob, a separate model).

COLORS (one named material each):
- iron_black: #22201E, ticking_grey: #8B8F95, deal_wood: #8A7258,
  footstool_red: #7A2A26, doll_dress: #2A2830, doll_skin: #EAD6C6,
  quilt_gold: #B88A3A, robe_crimson: #8E1F22, rug_crimson: #8A1C1E,
  rug_gold: #C9A04A, rug_indigo: #2E3560, rug_ivory: #E6DCC4,
  linen_white: #EDE8DC, silver: #C8C8C8, brass: #B8913A,
  shade_rose: #E89A9A, chair_wood: #5A3A24, cushion_red: #7A2830,
  book_green: #2F4A38, book_brown: #5A3A24

DETAIL BUDGET: up to 35,000 triangles for the whole set. Spend them on the
rug border, the quilt and the things on the side table.
DO NOT INCLUDE: walls, floor, ceiling, skylight, grate, fire, door,
ground, background, text, lights, camera
EXPORT: GLB, every object and material named as above
```

## 4. Ram Dass (ram_dass.glb)

```
Make a 3D model of a character for a browser game.

WHAT: Ram Dass, from "A Little Princess" (Burnett, 1905): the Indian
manservant of a sick English gentleman in London. About forty, slim, quiet
and dignified, with a sorrowful, homesick face that lights up completely
when he smiles. He moves without a sound. Treat him with exactly the same
realism and respect as every other character: no exaggerated features.
STYLE: [shared style block]
FACE: a believable adult man's face with a defined nose, brows, lips,
cheekbones and jaw; dark eyes only slightly larger than real; a neat short
black beard; a kind, grave expression.
BODY AND CLOTHES: real adult proportions, about 7.5 heads tall, slim.
Dressed all in white, as the book describes him, "white-swathed" and
"white-turbaned": a neatly wound white turban, a long white tunic to the
knee with a band collar, loose white trousers, a white shawl wrapped round
the shoulders, soft dark cloth slippers.
HANDS: shaped hands with the fingers together, slim, relaxed.
SIZE: 172 cm tall, real scale
ORIENTATION: Y is up, front faces +Z, feet on Y = 0, centred on X and Z
POSE: standing upright, arms hanging slightly away from the body

SEPARATE NAMED PARTS (each its own object, keep these exact names):
- head: head, face, beard and turban - pivot at the base of the neck
- eye_left, eye_right: pivot at the centre of each eye
- arm_left, arm_right: upper arms - pivot at the shoulder
- arm_left_forearm, arm_right_forearm: forearm and hand, children of the
  upper arms - pivot at the elbow
- leg_left, leg_right: thighs - pivot at the hip
- leg_left_lower, leg_right_lower: shin and foot, children of the thighs
  - pivot at the knee (he will crouch at the skylight)
- body: torso, tunic and shawl

COLORS (one named material each):
- cloth_white: #E9E4D8, shawl_white: #DCD5C6, skin: #8A5A3C,
  beard_black: #1A1614, slipper_dark: #2A2420

DETAIL BUDGET: up to 25,000 triangles. Spend them on the face, the hands
and the folds of the turban and shawl.
DO NOT INCLUDE: ground, background, text, lights, camera
EXPORT: GLB, every part and material named as above
```

## 5. The monkey (monkey.glb)

```
Make a 3D model of an animal for a browser game.

WHAT: the Indian gentleman's small pet monkey from "A Little Princess"
(Burnett, 1905): "impish", always ready for adventure, with a "small black
face". A small long-tailed monkey with soft brown-grey fur.
STYLE: [shared style block]
SIZE: body and head 35 cm long, tail 45 cm, 22 cm tall on all fours
ORIENTATION: Y is up, front faces +Z, paws on Y = 0. The origin is on the
ground directly under the shoulders (not mid-body, and not the tail).
POSE: on all fours, tail curving up behind

SEPARATE NAMED PARTS (each its own object, keep these exact names):
- head: pivot at the neck
- arm_left, arm_right: front legs - pivot at the shoulder
- leg_left, leg_right: back legs - pivot at the hip
- tail_1, tail_2, tail_3: the tail in three chained segments, each a child
  of the one before - pivot at the base of each
- body: the torso

COLORS (one named material each):
- fur_brown: #6E6050, fur_pale: #A89A86, face_black: #1E1A18,
  eye_amber: #B07A2A

DETAIL BUDGET: up to 10,000 triangles.
DO NOT INCLUDE: ground, background, text, lights, camera
EXPORT: GLB, every part and material named as above
```

## 6. Mr. Carrisford (carrisford.glb)

```
Make a 3D model of a character for a browser game.

WHAT: Mr. Carrisford, "the Indian gentleman" from "A Little Princess"
(Burnett, 1905): an Englishman back from India, very ill, "a man with a
haggard, distressed face, and a skeleton body wrapped in furs". He says he
can "only sit here wrapped in furs and stare at the fire". About forty,
looking much older.
STYLE: [shared style block]
FACE: a believable, gaunt adult face: hollow cheeks, deep-set tired eyes,
a sallow yellowish complexion, thinning dark hair, clean-shaven. Grave,
but able to soften. No caricature.
BODY AND CLOTHES: real adult proportions, very thin. A dark dressing gown
over a white shirt, a heavy fur rug over his knees and a fur-lined wrap
round his shoulders.
HANDS: thin hands with the fingers together, resting on the fur rug.
SIZE: real scale for a man of 180 cm, seated
ORIENTATION: Y is up, front faces +Z, the chair's feet on Y = 0, centred
on X and Z
POSE: seated deep in a high-backed wing armchair, slumped a little

SEPARATE NAMED PARTS (each its own object, keep these exact names):
- head: pivot at the base of the neck
- eye_left, eye_right: pivot at the centre of each eye
- arm_left, arm_right: upper arms - pivot at the shoulder
- arm_left_forearm, arm_right_forearm: forearm and hand - pivot at the
  elbow
- body: torso, dressing gown, wrap, legs and fur rug
- chair: the wing armchair, dark green leather, its own object

COLORS (one named material each):
- skin_sallow: #D2B48A, hair_dark: #3A3028, gown_dark: #2A2430,
  shirt_white: #E4DED2, fur_brown: #5A4632, fur_pale: #9A8670,
  leather_green: #2F3A2A

DETAIL BUDGET: up to 25,000 triangles. Spend them on the face and hands.
DO NOT INCLUDE: ground, background, fire, text, lights, camera
EXPORT: GLB, every part and material named as above
```

## 7. Melchisedec (melchisedec.glb)

```
Make a 3D model of an animal for a browser game.

WHAT: Melchisedec, the large grey attic rat Sara has tamed in "A Little
Princess" (Burnett, 1905). He sits up to take crumbs. Not frightening:
bright-eyed, whiskered, a little shabby.
STYLE: [shared style block]
SIZE: body and head 22 cm, tail 20 cm, 12 cm tall sitting up
ORIENTATION: Y is up, front faces +Z, feet on Y = 0, origin on the ground
under his hind feet
POSE: sitting up on his hind legs, front paws held together at his chest

SEPARATE NAMED PARTS (each its own object, keep these exact names):
- head: pivot at the neck
- tail: pivot at its base
- body: everything else

COLORS (one named material each):
- fur_grey: #6A6660, fur_pale: #9A958C, nose_pink: #C08A84,
  eye_black: #0E0C0C

DETAIL BUDGET: up to 6,000 triangles.
DO NOT INCLUDE: ground, background, text, lights, camera
EXPORT: GLB, every part and material named as above
```

---

## 8. The candle in Sara's hand (candle.glb)

Milestone 2 has Sara carry her candle-end; it sits at the bottom of the view the whole game, so it is
seen closer than anything else.

```
Make a 3D model of a small prop for a browser game, seen very close up.

WHAT: a poor child's candle-end in an old tin chamberstick, the kind
carried up to an attic at night, about 1890. A shallow round tin saucer
with a raised rim, dented and worn bright at the edge, a short socket in
the middle, and a ring handle on the side for one finger. In the socket,
a stub of cheap tallow candle, only 4 cm left, with wax run down one
side in soft drips onto the saucer, and a short black wick.
STYLE: stylized realism with a storybook warmth, like a high-quality
animated film: real-world proportions and believable detail, gently
softened and rounded, as if lovingly hand-made. Not a photo, not a
cartoon, not chunky or toy-like. Smooth shading, no outlines, soft worn
edges. Period-accurate for a London town house, about 1890.
SIZE: saucer 11 cm across, 1.5 cm deep; candle stub 2 cm across, 4 cm
tall; ring handle 3 cm across. Real scale.
ORIENTATION: Y is up, the handle points toward +X, origin at the centre
of the underside of the saucer.

SEPARATE NAMED PARTS (each its own object, keep these exact names):
- saucer: the tin saucer, rim and socket
- handle: the ring handle
- candle: the tallow stub and its drips, origin at the base of the stub
  so the game can shorten it as it burns
- wick: the black wick, origin at its base
- hand: a girl's right hand, eleven years old, holding the chamberstick
  with one finger through the ring and the thumb resting on top of it,
  with the frayed cuff of a black sleeve that is too short for her. A
  separate object the game can hide.

COLORS (one named material each):
- tin: #8E8C86, tin_worn: #BDB9AE, tallow: #EDE2C8, wick_black: #1A1614,
  skin: #EED3C2, sleeve_black: #221E26

DETAIL BUDGET: up to 8,000 triangles. Spend them on the drips, the rim
and the fingers.
DO NOT INCLUDE: the flame (the game makes it), ground, background, text,
lights, camera
EXPORT: GLB, every part and material named as above
```

## 9. The grate (grate.glb)

The chimney breast it sits in is built in code; this is the ironwork. Cold now, lit in the morning, so the
coals and the ash are their own objects.

```
Make a 3D model of a small fireplace grate for a browser game.

WHAT: the "rusty grate" in a servant's attic in "A Little Princess"
(Burnett, 1905): a small cheap cast-iron register grate, about 1890,
set into a plastered chimney breast. Long unused: rust bloom on the
iron, a few cold black coals in the basket, grey ash beneath.
STYLE: stylized realism with a storybook warmth, like a high-quality
animated film: real-world proportions and believable detail, gently
softened and rounded, as if lovingly hand-made. Not a photo, not a
cartoon, not chunky or toy-like. Smooth shading, no outlines, soft worn
edges. Period-accurate for a London town house, about 1890.
SIZE (real scale, cm): the iron surround 66 wide x 70 tall, standing
3 cm proud of the wall; the opening 46 wide x 50 tall; the fire basket
of 5 horizontal bars across the lower half of the opening; a flat iron
hob each side of the basket, its top 30 cm above the floor, 14 cm wide
and 10 cm deep; a stone hearth slab in front, 80 wide x 30 deep x 2.5
thick.
ORIENTATION: Y is up, the grate faces +Z, origin on the floor at the
centre of the wall face (the hearth slab sits in front of it, toward +Z).

SEPARATE NAMED PARTS (each its own object, keep these exact names):
- surround: the cast-iron frame with a little simple moulding
- basket: the bars of the fire basket
- hob_left, hob_right: the two hob plates
- back: the dark iron fireback inside the opening
- coals: a small heap of cold black coals in the basket (the game will
  make it glow)
- ash: a thin layer of pale grey ash under the basket and spilling a
  little onto the hearth
- hearth: the stone slab

COLORS (one named material each):
- iron: #2A2826, rust: #6B3A22, coal: #1A1918, ash_grey: #9A958C,
  hearth_stone: #6E6A62

DETAIL BUDGET: up to 12,000 triangles.
DO NOT INCLUDE: the wall or chimney breast, fire, flames, ground,
background, text, lights, camera
EXPORT: GLB, every part and material named as above
```

## 10. Ram Dass's attic: the things made ready (next_door.glb)

Seen from the leads, looking down through his propped skylight. Clue 3 rests on it, and the rug, folding
chair and folding table must be **the same ones** that appear in Sara's attic the next morning: attach
the screenshot of attic_warm.glb to this prompt.

```
Make a 3D model of a set of objects for a browser game. The room itself
is built separately: model ONLY the pieces listed, each at the exact
position given.

WHAT: the attic of an Indian manservant next door, in "A Little
Princess" (Burnett, 1905), on the night he has everything ready to carry
across the roof: "all his packages being in readiness in the attic which
was his own." Parcels in brown paper and string, a rich crimson rug
rolled up and stood on end, a folding chair and a folding table folded
flat, and his dark lantern, lit. Plain and tidy, his own few things
simple; the parcels are what matter.
STYLE: stylized realism with a storybook warmth, like a high-quality
animated film: real-world proportions and believable detail, gently
softened and rounded, as if lovingly hand-made. Not a photo, not a
cartoon, not chunky or toy-like. Smooth shading, no outlines, soft worn
edges. Period-accurate for a London town house, about 1890.
MATCHING: the rug, the folding chair and the folding table are the same
ones as in the attached screenshot (the morning set), only rolled and
folded. Same colours, same border, same wood.

ROOM FRAME: origin = the centre of the attic floor, Y up, units in cm.
The floor runs X -150..150, Z -180..180. The ceiling slopes from 140 cm
high at Z -180 to 300 cm at Z +180. The far wall is at X -150.

PIECES (each its own named object, origin at its base):
- parcel_1: 55 x 36 x 42 cm, at X -118, Z 15
- parcel_2: 42 x 30 x 36 cm, stacked on parcel_1 (base at Y 36)
- parcel_3: 62 x 26 x 46 cm, at X -112, Z -120
- parcel_4: 30 x 22 x 30 cm, on parcel_3 (base at Y 26)
- parcel_5: 50 x 42 x 38 cm, at X -55, Z 95
  All in brown paper with creased folds, tied both ways with pale string
  knotted on top. Raise the string 0.5 cm proud of the paper.
- rug_rolled: the crimson rug rolled tight, 120 cm tall, 24 cm across,
  standing on end with its base at X -125, Z -45 and its top leaning
  against the wall. The gold and indigo border shows as bands at each
  end of the roll.
- table_folded: the small folding table folded flat, leaning against
  the wall at Z -75
- chair_folded: the folding chair folded flat, leaning against the
  wall at Z -95, without its cushions
- lantern: a dark lantern of about 1890: a tin cylinder 16 cm across
  and 24 cm tall, a conical vented cap, a carrying ring on top, a round
  glass bull's-eye lens on the front and a curved sliding shutter
  half-open beside it. Its base at X -120, Y 66, Z 17 (on top of
  parcel_2), the lens facing +X.
- lantern_lens: the glass lens as its own object, so the game can make
  it glow

COLORS (one named material each):
- paper_brown: #8A6E4C, string: #D8CDB4, rug_crimson: #8A1C1E,
  rug_gold: #C9A04A, rug_indigo: #2E3560, chair_wood: #5A3A24,
  tin: #4A463E, lens_glass: #FFD28A

DETAIL BUDGET: up to 20,000 triangles. Spend them on the rug's ends,
the string and the lantern.
DO NOT INCLUDE: walls, floor, ceiling, skylight, ground, background,
text, lights, camera
EXPORT: GLB, every object and material named as above
```

## 11. Becky's attic (becky_attic.glb)

Clue 6 is that this room is untouched in the morning, so it must be as cold and poor as Sara's was, and
just as carefully made: the player compares the two.

```
Make a 3D model of a set of furniture for a browser game. The room's
walls, floor, ceiling, skylight and door are built separately: model
ONLY the pieces listed, each at the exact position given.

WHAT: the attic of Becky, a fourteen-year-old scullery maid, next to
Sara's in "A Little Princess" (Burnett, 1905). Even poorer than Sara's:
everything worn, mended and cold. A narrow iron bedstead with a thin
lumpy mattress and a grey blanket with a darned patch, an old wooden
box she uses as a table, a chipped enamel jug in a basin on it, and her
spare apron and cap hanging on the wall.
STYLE: stylized realism with a storybook warmth, like a high-quality
animated film: real-world proportions and believable detail, gently
softened and rounded, as if lovingly hand-made. Not a photo, not a
cartoon, not chunky or toy-like. Smooth shading, no outlines, soft worn
edges. Period-accurate for a London town house, about 1890.

ROOM FRAME: origin = the centre of the attic floor, Y up, units in cm.
The floor runs X -130..130, Z -180..180. The ceiling slopes from 140 cm
high at Z -180 to 300 cm at Z +180. The door is in the +Z wall at
X -65: keep X -110..-20, Z 100..180 clear.

PIECES (each its own named object, origin at the base of the piece):
- bedstead: a narrow old iron bedstead, black paint chipped to rust,
  footprint X 40..130, Z -95..95, head rail (95 cm high) at Z +95, foot
  rail (60 cm) at Z -95
- mattress: thin and lumpy, a rounded box with soft edges (not a
  stretched sphere), 88 x 188 x 8 cm, its top 46 cm above the floor
- blanket: a thin grey blanket over most of the mattress, a darned patch
  in one corner, hanging 12 cm over the sides
- pillow: a flat sack pillow, a rounded box 45 x 28 x 6 cm, at the head
- box: an old wooden box on its side used as a table, 50 x 45 x 40 cm,
  at X -80, Z -50
- jug, basin: a chipped white enamel jug standing in a matching basin
  on the box
- apron: a spare grey-white kitchen apron and a crumpled white cap
  hanging from one point on the wall at X -128, Y 140, Z 20 (the nail is
  built in code)

COLORS (one named material each):
- iron_black: #22201E, rust: #6B3A22, ticking_grey: #8B8F95,
  blanket_grey: #6A6764, darn_wool: #8A7A66, sack: #A8A08E,
  box_wood: #7A6448, enamel_white: #E4E0D6, enamel_chip: #2A2826,
  apron_grey: #B9B2A4, cap_white: #D8D2C4

DETAIL BUDGET: up to 15,000 triangles.
DO NOT INCLUDE: walls, floor, ceiling, skylight, door, nail, candle,
ground, background, text, lights, camera
EXPORT: GLB, every object and material named as above
```

## What to check when each GLB comes back

- The screenshot first: shapes, faces, colours.
- In the game: size against the room, the origin where the prompt says, and every part name present.
- From eye height (1.38 m, Sara's): does it read? Is anything a key clue needs flush or dark?
- The Speckled Band's lessons: joints usually come back at the feet (`fixJoints()` repairs it, so
  don't spend a fix round on it), and faces stop improving after one fix round.
