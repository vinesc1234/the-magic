# The Magic: model prompts for Claude Design

One model per prompt. Paste a prompt into Claude Design as it is, export the GLB, and send it back
**with a screenshot**. Make them in this order: Becky first (people are the riskiest part, so find out
early whether the faces work), then the two attic sets, then Ram Dass, the monkey, Mr. Carrisford, and
Melchisedec last (he comes out for crumbs, so he is needed).

Everything described here is from Burnett's 1905 novel (Project Gutenberg #146). Where a prompt quotes
the book, the quote is there so Design gets the period details right, not to be copied into the game.

## Shared style block (paste into every prompt where it says [shared style block])

```
STYLE: stylized realism, like a high-quality animated film: real-world
proportions and believable detail, but slightly simplified and smoothed.
Not a photo, not a cartoon, not chunky or toy-like. Smooth shading, no
outlines, soft worn edges. Period-accurate for a London town house,
about 1890.
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
one was found. So there are seven models, not eight.

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
- kettle: a little brass kettle, 18 cm across, its base at X -52, Y 30,
  Z 147 (it sits on a hob beside the fire, built in code).

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

## What to check when each GLB comes back

- The screenshot first: shapes, faces, colours.
- In the game: size against the room, the origin where the prompt says, and every part name present.
- From eye height (1.38 m, Sara's): does it read? Is anything a key clue needs flush or dark?
- The Speckled Band's lessons: joints usually come back at the feet (`fixJoints()` repairs it, so
  don't spend a fix round on it), and faces stop improving after one fix round.
