# 명퇴용사 박부장: art assets

Every image is pixel art at its native size. Alpha is binary (0 or 255), there is no anti-aliasing and palettes are limited.
Scale up only by an integer factor with nearest-neighbour.

## Folder map

| Path | Contents |
|---|---|
| `park/idle_0..3.png`, `park/walk_0..5.png`, `park/attack_0..7.png` | Park, the fantasy hero: 2 heads tall, 52, balding on top with side hair, thick moustache, tired droopy eyes, small belly. He wears a plain tunic, belt, trousers and boots, plus a loosened red necktie. Each frame is 64×64, facing east (right). |
| `park/{idle,walk,attack}_strip.png` | The same frames in one horizontal strip per animation (frame *i* at x = 64·i). |
| `park/anchors.json` | Per-frame anchors and timing. |
| `park/park_ref_front.png` | Front-view reference sprite used to build the character (64×64). |
| `park/old/` | The previous office-worker Park (68×68 frames, anchors, candidates, previews). Kept for reference only. `park/old/attack_v3/` is the earlier hand-built attack and `park/old/attack_v4/` the PixelLab attack that came before the current one. |
| `park/preview/` | Composited previews and contact sheets (see Previews). |
| `parts/suits/s{set}_{slot}.png` | 36 costume parts: 6 sets × 6 slots, each on a 64×64 transparent canvas drawn on idle frame 0. |
| `parts/suits/strips/s{set}_{slot}_{anim}.png` | The same parts redrawn for every frame of idle, walk and attack (108 strips). The 36 `_attack` strips were redone for the current attack by inpainting each set onto the bare attack frames (see How it was made); the previous ones are in `parts/old_suits_v2/attack_v4_strips/`. |
| `parts/suits/parts.json` | Slot, anchor, offset, layer, bbox and strip paths of every part. |
| `park/fx/head_shine.png`, `park/fx/head_shine.json` | Animated glint on Park's bald crown (6 frames, 11×11 each). |
| `parts/old_suits/` | The first office-suit parts. They fit only `park/old/` and are kept for reference. |
| `parts/old_suits_v2/` | The previous code-drawn fantasy parts, replaced by the current ones. Kept for reference. |
| `parts/gear/g00..g29.png` | 30 hand-held office items (업무 장비), each at most 24×24, drawn upright. |
| `parts/gear/scaled/` | Pixel-clean, pre-shrunk copies of the bulky items (see `scale`). |
| `parts/gear/gear.json` | Grip point, default angle and scale of each item. |
| `backgrounds/*.png` | 7 department battle backgrounds (부서 배경), 320×96, opaque, tile horizontally. |
| `icons/*.png` | UI icons, 32×32, plus 16×16 small icons named `*_s.png`. `icons/_sheet.png`, `_sheet_ui.png`, `_sheet_small.png` and `_sheet_aura_legend.png` are contact sheets. |
| `vx/*.png` | 13 VX shop product images, 512×512 (128×128 pixel art scaled ×4 nearest-neighbour). The 128 px sources are in `vx/src/`, and `vx/_sheet.png` shows all of them. |
| `icons/extra/`, `parts/gear/extra/` | Unused extras left over from generation. They can be deleted. |
| `story/prologue_1..7.png`, `story/ep0_1..4.png`, `story/ep1_1..6.png`, `story/hunter_1..4.png`, `story/ep2_1..4.png`, `story/ep3_1..4.png`, `story/ep4_1..4.png`, `story/ep5_1..5.png` | Webtoon panels (prologue, episodes 0.5–5, headhunter), 192×128, opaque, no text. `story/_sheet_prologue.png`, `_sheet_ep0.png`, `_sheet_ep1.png`, `_sheet_hunter.png`, `_sheet_ep2.png`, `_sheet_ep3.png`, `_sheet_ep4.png` and `_sheet_ep5.png` show them ×2 in reading order; `story/src/` holds the raw picks, unused alternates and the character references. See Story panels. |

## Park

- Canvas: 64×64. The lowest pixel row (boot soles) is always y = 56 (`baselineY`), and the body is about 44 px tall.
- Animations:

  | Animation | Frames | Duration per frame | Loops |
  |---|---|---|---|
  | `idle` | 4 | 250 ms | yes |
  | `walk` | 6 | 110 ms | yes |
  | `attack` | 8 | 75 ms | no |

- The attack is a one-handed overhead-to-forward slash with the **near (viewer-side) hand**, the same hand that holds the item in idle and walk. The far arm stays relaxed behind the torso in every frame. The body leans back on the wind-up and forward into the strike.

  | Frame | Pose | `hand` | `handAngle` |
  |---|---|---|---|
  | 0 | ready, fist at the belly | 31, 45 | −40 |
  | 1 | anticipation, fist pulled up beside the ear | 26, 30 | −120 |
  | 2 | wind-up, fist high behind the head | 18, 18 | −160 |
  | 3 | swing start, fist in front of the forehead | 32, 20 | −70 |
  | 4 | impact, arm straight forward (`impactFrame: 4`) | 45, 37 | 0 |
  | 5 | follow-through, fist low in front | 43, 46 | 45 |
  | 6 | recoil | 31, 46 | 10 |
  | 7 | recovery | 31, 46 | −30 |

- Frames 1–3 have `gearAboveHelmet: true`: the raised arm is in front of the head, so draw the item and gloves after the helmet there. No frame needs `gearBehindBody`.
- The previous attacks are kept in `park/old/attack_v2/`, `attack_v3/` and `attack_v4/` (`attack_v4/anchors_attack.json` holds the anchors that went with v4).

### `park/anchors.json`

Coordinates are pixels inside each frame's own canvas: origin at the top-left, x to the right, y down.
Angles are screen-space degrees: 0 points right (the way Park faces), −90 up, 90 down, and positive angles turn clockwise on screen.

Each frame has:

- `head`: top-centre of the skull, where a helmet sits.
- `neck`: the tie knot / collar front, where the cape ties and necklaces hang.
- `torso`: the centre of the tunic.
- `hand`: the front fist, which is the item's grip point.
- `handAngle`: the direction the held item points.
  - Idle and walk: measured from the shoulder→fist direction, about −30° (item tilted up and forward).
  - Attack: set by hand along the swing arc (see the table above): up and back on the wind-up, forward at impact, down-forward on the follow-through.
- `feet`: ground contact centre.

The anchors were measured with Pillow from the PNGs by segmenting skin, tunic, necktie and outline.

## Costume parts (`parts/suits/`)

Slots: `helmet`, `armor`, `cape`, `gloves`, `boots`, `accessory`.

### Sets

Each set was dressed once on Park's idle frame 0 (see How it was made). The shapes differ per set, not only the colours.

| id | Set | helmet | armor | cape | gloves | boots | accessory |
|---|---|---|---|---|---|---|---|
| 1 | 수습 용사 | stitched brown leather cap-helmet over the ears | worn leather jerkin over the tunic | short ragged brown cloth cape | leather gloves | worn leather boots | new-hire ID badge on a blue lanyard |
| 2 | 영업왕 | polished bronze helm with a tall red plume | gleaming bronze breastplate and round pauldron | red cape with gold trim to the knees | bronze gauntlets | bronze greaves | the necktie turned gold, with a ruby pin |
| 3 | 야근 흑기사 | dark iron helmet with two short horns and a nose guard | bulky dark iron plate with a spiked pauldron | long tattered black cape | dark iron gauntlets | heavy dark iron boots | coffee mug hanging from the belt |
| 4 | 주말 등산 레인저 | green ranger hood | moss-green leather jerkin with a cross strap | green cloak to the knees | green fingerless gloves | tall brown hiking boots with red laces | brass compass and carabiner |
| 5 | 임원 성기사 | polished silver dome helm with ear guards | silver plate around chest and belly, round pauldron | long white cape with blue trim | silver gauntlets | silver greaves and sabatons | holy medallion on a silver chain |
| 6 | 회장님 황금 갑주 | ornate golden crown-helm with jewelled spikes and a ruby | ornate gold plate with a huge pauldron | wide royal red cape with gold trim and an ermine collar | gold gauntlets | gold greaves | big ruby amulet on a heavy gold chain |

### `parts.json`

- `parts["s{set}_{slot}"]` contains:
  - `file`
  - `slot`
  - `anchor`: helmet→head, armor→torso, cape→neck, gloves→hand, boots→feet. For the accessory: necklace-type items (sets 1, 2, 5, 6) follow neck, and belt items (sets 3, 4) follow torso.
  - `offset`
  - `layer`
  - `behindBody`: true for capes.
  - `bbox`
  - `strips`
- `layerOrder` (bottom to top): `cape`, `body`, `boots`, `armor`, `accessory`, `gear`, `gloves`, `helmet`. The cape is drawn **behind** Park's body, and the helmet is always on top. The held item sits under the gloves so the fist wraps around it.
- **Strip mode (use this):** draw frame *i* of `strips[anim]` at the same origin as Park's frame *i*. Every part was fitted to Park's own silhouette in that frame: armour wraps the torso, belly and arms, boots replace the lower legs and feet, gloves replace the hand pixels, helmets cover the scalp down to the brow, and capes hang behind the shoulders and sway while walking and attacking.
- **Anchor mode:** draw `file` at `frame[anchor] + offset`. `offset` is −anchor at idle frame 0, so on idle frame 0 every part lines up at (0, 0). On other frames this only translates the idle-0 drawing.
- Parts from different sets can be mixed freely, because they all share the same canvas and origin.
- `headShine` (in `parts.json`): the bald-head glint (`park/fx/head_shine.json`) plays **only while the helmet slot is empty**. Any helmet hides it.

## Head shine (`park/fx/`)

- `head_shine.png` is a strip of 6 cells, each 11×11. The star centre is cell pixel (5, 5).
- The sequence is a small dot, then a pop to a 4-arm star with diagonal sparkles, then a fade. It is white and pale yellow with no outline.
- `head_shine.json` contains:
  - `fps`: 12;
  - `repeatEveryMs`: 2000 (a suggested pause between twinkles);
  - `anchor`: `head`, with `offset` [5, 2] from the head anchor;
  - `perFrameOffset[anim][frame]`, which puts the star on the scalp highlight of that exact frame.
- To draw it, place the cell at head + offset − (5, 5), above the body and below every costume layer.
- Show it only when no helmet is worn.
- The optional moving highlight across the scalp was not made. The twinkle alone reads well at 1×.

## Office items (`parts/gear/gear.json`)

- `grip: [x, y]` is the pixel the fist holds, inside the item PNG (bottom-centre, because every item is drawn upright).
- `angle: -90` means the item points up as drawn.
- To draw an item: put `grip` on the frame's `hand` anchor and rotate it about the grip by `handAngle − angle` (nearest-neighbour).
- `scale` is new:
  - Bulky items have scale ≈ 0.54. They are 결재판, 서류가방, 계산기, 스테이플러, 탁상 달력, 머그컵, 전화기, 팩스, 마우스, 모니터, 의자, 책상, 화이트보드, 프로젝터, 태블릿, 메신저, 휴대폰, 도장, 명함 케이스, 다이어리, 법인카드, 회장님 결재판 and 노트북.
  - At that scale they stay within about 30% of Park's 44 px body (at most 13 px).
  - Long, thin items keep scale 1: pen, highlighter, ID lanyard, toner, keyboard, fountain pen and putter.
- For scaled items, use `scaledFile` with `scaledGrip` and `scaledSize`. These copies were shrunk with a pixel-art downscaler, which looks cleaner than scaling at runtime.

## Backgrounds

| File | Department |
|---|---|
| `bg_general_affairs.png` | 총무팀 |
| `bg_sales.png` | 영업팀 |
| `bg_legal.png` | 법무팀 |
| `bg_dev.png` | 개발팀 |
| `bg_finance.png` | 재무팀 |
| `bg_executive.png` | 임원실 |
| `bg_parking.png` | 지하주차장 |

The floor strip is the bottom 27–34 px; the floor starts at about y 62–69. To stand Park on floor line F, draw his frame at y = F − 56 (the previews use F = 82). Draw each background again at x + 320 to scroll it forever.

## Icons

- Currencies: `gold`, `ticket`, `gem`, `coupon`
- Bottom menu: `nav_sidejobs`, `nav_gear`, `nav_pets`, `nav_certs`, `nav_shop`, `nav_dungeon`, `lock`
- Side menu: `side_suits`, `side_apartment`, `side_relics`, `side_office`, `prestige`
- Relics: `r_badge`, `r_plaque`, `r_watch`, `r_cards`, `r_pin`, `r_stamp`, `r_pas`, `r_fan`
- Office gear: `o_keyboard`, `o_mouse`, `o_chair`, `o_monitor`
- Costume auras (불꽃 tab): `aura_1` … `aura_6`
- Legend costume pieces (전설 tab): `legend_helmet`, `legend_armor`, `legend_cape`, `legend_gloves`, `legend_boots`

No image contains text.

## Previews (`park/preview/`)

- `full_sets_x4.png` (1×: `full_sets.png`): the 6 full sets on idle frame 0, each holding an item.
- `mixed_outfits_x4.png`: bare Park with a pen, and two mixed outfits:
  - hood + gold armour + black cape + bronze gloves + leather boots + coffee mug, holding a keyboard;
  - gold crown-helm + leather jerkin + white cape + dark gauntlets + hiking boots + ID badge, holding a laptop.
- `anim_all_sets_x3.png` (1×: `anim_all_sets_x1.png`): one row per outfit across all 18 frames (idle 4, walk 6, attack 8). The rows are bare Park, sets 1–6, then the two mixed outfits.
- `anim_bare_x4.png`, `anim_s1_x4.png` … `anim_s6_x4.png`, `anim_mixA_x4.png`, `anim_mixB_x4.png`: the same outfits, one sheet each at 4×.
  - `mixA` = helmet 4, armor 6, cape 3, gloves 2, boots 1, accessory 3, holding a keyboard.
  - `mixB` = helmet 2, armor 5, cape 6, gloves 3, boots 4, accessory 1, holding a laptop.
- `park_strips_x3.png`: bare Park idle/walk/attack, then set 2 holding a pen.
- `attack_bare_gear_x1.png` / `_x4.png`: the current attack, bare, with an item drawn on `hand` at `handAngle` (rows: pen, putter, keyboard, briefcase), following `gearAboveHelmet`.
- `attack_costumes_inpaint_x4.png` (1×: `attack_costumes_inpaint_x1.png`): the current attack with the new costume strips, one row per outfit: bare (pen), sets 1–6 fully worn (each holding a different item), then `mixA` (keyboard) and `mixB` (laptop). Items are drawn on `hand` at `handAngle` with `gearAboveHelmet` layering.
- `attack_s2_spritegen_registration_test_x4.png`: the set 2 sprite-gen registration test (why the costume attack was inpainted instead; see Known issues).
- Every other preview that shows attack frames (`anim_*`, `park_strips_x3.png`, `attack_bare_pen_*`, `hand_check_x4.png`) was made with an earlier attack and is out of date.
- `attack_bare_pen_x1.png` / `_x4.png`: the 8-frame slash holding the pen. `hand_check_x4.png`: every idle/walk/attack frame with the pen and a red dot on `hand`, showing that it is always the same near hand.
- `head_shine_x4.png`: the glint playing on bare Park's idle loop. `head_shine_strip_x8.png` shows the 6 shine cells.
- `on_backgrounds_x3.png`: Park in a costume standing on each of the 7 backgrounds.
- `parts_sheet.png`: all 36 parts. `gear_sheet.png` and `gear_sheet_scaled.png`: the 30 items at full size and with `scale` applied.

## How it was made

- **Park:**
  - Codex image generation (sprite-gen, provider codex) made a front-view reference. It was reduced to a 64×64 sprite with a kCentroid pixel-art downscaler and a 21-colour palette.
  - PixelLab `create_character` (v3 with that reference) rotated it into 8 directions. The east direction was animated:
    - idle and walk from templates;
    - attack (current): made with the sprite-gen image-row pipeline (`prepare` → `gen-set --provider codex` → `extract` → `compose-atlas`). The base was `park/idle_0.png` scaled ×8 nearest-neighbour. Extraction used `fit` pixel_unfake (64×64 cell, logical 64, foot-centroid / bottom alignment, so the soles sit on y = 56, shared 32-colour palette). Two rows were generated and the more readable one was kept whole (all 8 frames from one row). Each colour was then snapped to the nearest colour of Park's idle/walk palette where that colour was not already taken. No pixel was redrawn. The run is in `sprite-gen/runs/park-attack/run1`.
- **Costume parts:**
  1. For each set, PixelLab Pro Flash inpaint dressed Park's idle frame 0. The mask covered the scalp, ears, body, hands, legs and a band behind the back; the face stayed pixel-exact. The outfit was therefore drawn on Park's real silhouette, with his light direction (upper left) and black outline.
  2. Each dressed frame was split into slots by comparing it with the bare frame, by region: head → helmet, back band → cape, torso and arms → armor, below the waist → boots, hands → gloves.
  3. Each slot was then carried to all 16 frames:
     - Helmet and armour follow the best-matching head or torso position.
     - Body pixels the shifted garment does not cover are re-shaded from Park's own pixels. Their brightness is mapped onto the garment's colour ramp, so the shading matches his pose and light.
     - Boots and gloves are rebuilt on each frame's real legs and hands.
     - Capes hang from the back of the collar, sway in walk and attack, and are tucked under the body so there are no gaps.
  4. Accessories are small hand-placed pixel items on the chest or belt.
  5. **Attack strips (current):** each set was inpainted onto the 8 bare attack frames with PixelLab Pro Flash. Pixel registration is exact: outside the mask every pixel is the bare frame's own pixel.
     - **Mask:** the body dilated by 3 px, plus a band above the head (plumes, crowns) and a band behind the back (capes). The face (eye, nose, moustache, cheek) was left out of the mask, so it stays pixel-exact.
     - **Reference:** the set's dressed idle frame 0 sat in the same image, in one cell of a 2×2 sheet with three attack frames (set 1: a 3×3 sheet with all eight).
     - **Extra passes:** set 1 needed a second pass over the head only, because the first pass left the scalp bare. For set 2, frame 3 lost its raised arm and got one repair pass with the bare arm pasted back as a guide.
     - **Slot split:** each dressed frame was diffed against the bare frame and assigned by region, as for idle:
       - pixels above the neck → helmet;
       - the fist plus 1 px → gloves;
       - colours closest to the set's accessory palette on the chest or belt → accessory (grown into touching off-ramp colours);
       - new pixels behind the back → cape;
       - below y 49 → boots;
       - everything else → armor.
     - **Skipped pixels:** where both the bare and the dressed pixel are skin, nothing is stored, so Park's own face and hand show.
     - **Gap fill:** where the dressed silhouette came out 1–3 px narrower than the bare body (mostly outline pixels at the belly, back and face edge), the gap was filled automatically from the neighbouring dressed pixels: the darkest neighbour on the silhouette edge, otherwise a light neighbour. This keeps bare pixels from showing through. It was done by script and was not hand-drawn.
- **Office items, backgrounds and icons:** unchanged from the previous delivery, except for the new `scale` data and the scaled copies.

## Generation budget

- **Office-object monster redo (PixelLab):** **40 generations**: 2 × 16-candidate `create_1_direction_object` batches at 64×64 (20 each). Another session drew webtoon panels on the same account at the same time, so the balance drop over that period is larger.
- **Aura / legend icons, speech bubble, red dot (PixelLab):** **43 generations**: 2 × 64-candidate batches (20 each; 32 px icons, 24 px UI), 2 × Pixen 16×16 red dots and 1 × Pixen edit test that tried to add a glow to the helmet (rejected: it only added noise).
- **Costume attack strips (PixelLab Pro Flash inpaint):**
  - 22 calls in total:
    - 2 at 192×192 (set 1, both passes);
    - 18 at 128×128 (three per set for sets 2–6, plus three set 3 attempts that the content filter blocked);
    - 1 repair at 128×64;
    - 1 call rejected because its upload was truncated.
  - The balance went from 388 to 146 during this work. That figure includes at least 8 jobs from another session sharing the account, so it overstates the cost. By call count, this work used roughly 160–200 generations.
- **Attack remake, small icons, VX images:**
  - sprite-gen (Codex): 4 row generations (2 bare attack rows, 2 set 2 dressing tests).
  - PixelLab: the balance went from 512 to 388, so **124 generations** were used: 2 × 64-candidate icon batches (20 each) and 14 × Pro Flash 128×128 images (6 each, one of them a size test).
- **Costume redo (PixelLab):** the balance went from 720 to 689, so **31 generations** were used:
  - 1 × Pixen edit test (rejected: it redrew Park's proportions);
  - 6 × Pro Flash inpaint (5 each), one per set.
- **Fantasy remake (PixelLab):** the balance went from 725 to 720, so **5 generations** were used:
  - 1 × v3 character from a reference;
  - 2 × template animations (idle, walk);
  - 2 × v3 custom attack attempts.
- **Fantasy remake (Codex):** 3 reference candidates.
- **First delivery:** 9 PixelLab generations (734 → 725) and 16 Codex calls.

## Known issues

- The legend pieces have no separate glow halo: their "glow" is the pink-violet light on the metal. A Pixen edit to add a halo only produced noise. If a halo is wanted, draw it in CSS (`drop-shadow`) or generate another batch.
- `aura_1` is outlined in dark orange rather than near-black, so it is a little softer than the other five auras (which suits the starter tier).
- Each set was dressed by AI only on idle frame 0. The other 15 frames are fitted from that drawing, so fine details (straps, rivets) are sharpest at idle and simplified on body parts that move a lot. In the attack, the swinging sleeve and glove are re-shaded from the set's colours rather than drawn by AI.
- Park's hands are tiny in idle and walk, so gloves read mostly in the attack frames.
- The ranger hood (set 4) was drawn together with its cloak. Without the set 4 cape the hood still works, but its shoulder drape is gone.
- The swinging arm is short (chibi proportions), so in the overhead frames the fist stays at head height. The item itself provides the overhead reach.
- Costume attack strips:
  - **Why not sprite-gen:** a sprite-gen test dressed set 2 from its idle 0 with the bare attack row as a motion reference. The dressed figure came out about 4 px taller and its limbs were 1–3 px off, so a split by diff would not register (`park/preview/attack_s2_spritegen_registration_test_x4.png`). The strips were therefore made by inpainting instead.
  - **Gap fill:** the inpainted silhouettes were sometimes narrower than the bare body. Per frame, 0–114 such pixels were filled automatically from neighbouring dressed pixels; most were single outline pixels. The worst frames are set 3 frame 2, set 5 frames 1 and 3, and set 4 frames 3 and 6, where the front outline is a little thicker.
  - **Missing capes:** set 1 frame 1 has no cape, and in a few frames the cape is narrower than at idle.
  - **Raised arms:** on frames 1–3 (raised arm) the armour sleeve sometimes covers less of the upper arm than at idle. The tan tunic sleeve then shows under the gauntlet; set 1 is sleeveless by design.
  - **Accessories:** the slot was found by colour, so on some frames part of a lanyard, chain or mug is in the armor layer. If you mix outfits, the accessory can be incomplete on those frames.
- Frame 1 of the attack (`anticipation`) turns the face slightly toward the viewer, so the eye reads a little wider than in idle.
- Office items are drawn in a 24 px box. Use `scale` or `scaledFile` to keep bulky ones small.

## Monsters (`monsters/`)

- There are 36 monsters, 6 per department background. Each department has:
  - 3 normal monsters;
  - 1 team-leader boss;
  - 1 executive boss;
  - 1 spare normal monster (`spare: true`).
- Every monster faces west (left), toward Park.
- Sizes:

  | Role | Canvas | Feet line (y) | Body size |
  |---|---|---|---|
  | normal | 64×64 | 56 | up to 34 px tall, 46 px wide |
  | teamLeader | 64×64 | 56 | about 45–52 px tall |
  | executive | 80×80 | 72 | 58–68 px tall |

- Flying monsters hover 6 px above their feet line (`hoverPx`).
- Files per monster:
  - `{id}_idle.png`: 4 frames, 160 ms, loops. Ground monsters squash and stretch by 1 px; flying ones bob.
  - `{id}_hurt.png`: 2 frames, 90 ms. A white flash with a 3 px recoil away from Park, then a red tint.
  - `{id}_death.png`: 4 frames, 100 ms. A flash, a squash with a puff, a big smoke cloud, then fading puffs. The last frame is nearly empty.
  - Frame *i* of each strip is at x = frameWidth·i.
- `monsters.json` gives, per monster:
  - `id`, `name` (Korean), `department`, `departmentName`, `background`;
  - `role`, `spare`, `flying`;
  - `frameWidth`, `frameHeight`, `feetBaselineY`, `hoverPx`;
  - `hpBarAnchor` [x, y]: centre-top point for the HP bar, 4 px above the highest idle pixel;
  - `animations` with frame counts, ms per frame and looping.
- `departments[]` lists, per department, `normal`, `spareNormal`, `teamLeader` and `executive`, in floor order: 총무팀, 영업팀, 법무팀, 개발팀, 재무팀, 임원실.
- To draw a monster on floor line F, place its frame at y = F − feetBaselineY.
- How they were made:
  - Codex (sprite-gen) drew one sheet per department, plus a smoke-puff sheet.
  - Each monster was downscaled to its target size with the kCentroid pixel-art downscaler, given binary alpha and a 26-colour palette, and its outline snapped to `#0C0B0A`.
  - The animations are frame edits of that sprite.
- Previews (`monsters/preview/`):
  - `battle_{department}_x1.png` / `_x3.png`: Park next to each monster on its department background;
  - `anims_{department}_x2.png`: every idle, hurt and death frame.
- `_sheet.png`: all 36 monsters on idle frame 0 at ×2, one row per department (normal and spare, then team leader, then executive).

### Office-object redo (6 normal monsters)

Six normal monsters did not read as office monsters, so they were redrawn with the office object as the first read. The ids and file names are unchanged. The old strips are kept in `monsters/old/`.

| id | Name | Flying | Picture | Body (w×h) |
|---|---|---|---|---|
| `stapler_bat` | 스테이플러 박쥐 | yes | a black desk stapler whose open jaw has staple teeth, with purple bat wings | 41×32 |
| `clip_rat` | 클립 쥐 | no | a grey rat whose body and tail are bent silver paperclip wire, with a big paperclip tail loop | 46×29 |
| `phone_imp` | 전화 임프 | no | a red imp with a headset, clutching a huge beige desk-phone receiver, with a coiled beige phone-cord tail | 36×32 |
| `card_pixie` | 명함 종이학 (renamed from 명함 요정) | yes | a paper crane folded from white business cards with grey print lines and blue logo corners | 41×32 |
| `redtape_worm` | 레드테이프 웜 | no | a grey tape-dispenser head with cutter teeth and a tape roll, and a red tape body unrolling behind it | 46×29 |
| `card_bat` | 법인카드 박쥐 | yes | a black bat whose wings are a gold card and a black card, with a gold chip on its belly | 46×27 |

- **Generation:** PixelLab `create_1_direction_object` (sidescroller view), two batches of 16 candidates at 64×64, one per-item description each. The style references were `keyboard_mimic` and `calc_crab` idle frame 0. The best candidate of each was kept.
- **Downscale:** the candidate was cropped, scaled ×4 nearest-neighbour, and reduced with the same kCentroid downscaler (`sprite-gen`) to its body size. Alpha was made binary, the colours were reduced to at most 26 (median cut), and the darkest colours were snapped to `#0C0B0A`. Each sprite sits centred on the 64×64 canvas with its feet on y 56, or on y 50 for flyers (`hoverPx` 6).
- **Strips:** frame edits of that sprite, measured from the existing strips:
  - idle: ground monsters are frame 0, 1 px wider and 1 px shorter, frame 0, then 1 px narrower and 1 px taller (bottom-anchored); flyers bob 0, −1, −2, −1 px.
  - hurt: 75 % toward white with a 3 px recoil to the right, then a 35 % blend toward red (230, 38, 38) with a 1 px recoil. Outline pixels stay `#0C0B0A`.
  - death: frame 0 is the sprite 85 % white, 2 px wider and squashed to 85 % height. Frame 1 is the sprite 55 % toward light grey, 110 % wide and 52 % high, with the same small puff and sparkles as the other monsters of that body width. Frames 2 and 3 are the shared big cloud and fading puffs of a monster of the same width, moved to the new body centre. The widths were chosen (36, 41, 46) so that these puffs exist at exactly that size.
- `monsters.json`: only `name` (card_pixie), `bodyHeight`, `bodyWidth` and `hpBarAnchor` changed for these six; `flying`, `hoverPx` and the animation timings are as before.
- `sticky_moth` stays in the files and in the 총무팀 previews, but it is not in 총무팀's `spareNormal`.

### Humanoid bosses (batch A)

Five bosses were redrawn as people first: former office workers re-hired by 마왕그룹 as contract bosses and cursed into a zombie, ghost or demon version of their job. They are new ids; the entries are in `monsters/new_bosses_A.json` (`monsters` plus a `replace` map from old id to new id) and are not yet merged into `monsters.json`. The old strips are copied to `monsters/old/`.

| id (replaces) | Name | Role, department | Picture | Body (w×h) |
|---|---|---|---|---|
| `baek_bujang` (`copier_golem`) | 야근 좀비 백부장 | teamLeader, 총무팀 | a gaunt grey-green zombie man with messy dark hair, red-rimmed glaring eyes and stubble, a crumpled white shirt with rolled sleeves, an ID lanyard and a paper coffee cup, slouching | 41×52 |
| `gangsi_sangmu` (`cardigan_ogre`) | 결재 강시 총무 상무 | executive, 총무팀 | a pale blue hopping-zombie executive in a grey three-piece suit, arms stretched out, a yellow approval slip with one red stamp (no writing) on his forehead and a bunch of brass keys at his belt, caught mid-hop | 48×66 |
| `silijeok_timjang` (`megaphone_orc`) | 실적귀 영업팀장 | teamLeader, 영업팀 | a blue ghost sales manager in a shiny suit, glowing hollow eyes and forehead veins, shouting into a red megaphone with a rolled sales chart in the other hand, legs fading into wisps | 58×50 |
| `golf_sangmu` (`golf_minotaur`) | 골프광 영업 상무 | executive, 영업팀 | a tanned pot-bellied executive in a pink golf polo and checked trousers, cap and sunglasses, small horns through the cap, swinging a driver wreathed in dark purple flame | 51×66 |
| `sosong_timjang` (`scale_gargoyle`) | 소송 흡혈귀 법무팀장 | teamLeader, 법무팀 | a pale vampire lawyer with slicked-back hair, red eyes and small fangs, a black suit and red tie under a high-collared red-lined cape, holding a thick stack of lawsuit papers tied with a red ribbon | 49×51 |

- **Generation:** PixelLab `create_1_direction_object` (sidescroller view), one description per candidate:
  - 16 team-leader candidates at 64×64, with `megaphone_orc` and `pen_demon` idle frame 0 as style references;
  - 16 executive candidates at 80×80, with `golf_minotaur` and `judge_lich` idle frame 0;
  - one 80×80 re-roll of 16 with `golf_minotaur` only, because the first talismans had glyph-like squiggles and the golfers stood square to the viewer.
  - The jiangshi pick faced right and was mirrored; the other picks already faced west.
- **Downscale:** each pick was cropped, scaled ×4 nearest-neighbour and reduced with the kCentroid downscaler (`sprite-gen`) to its body height (team leaders 50–52 px, executives 66 px). The palette is the pick's own colours merged pairwise (closest pair first) down to 25, plus `#0C0B0A` for the outline (26 in total). This keeps small accent colours, such as the zombie's red eyes and the coffee cup, that a median cut lost. Alpha is binary. Each sprite is centred on its canvas with its feet on the role's feet line (y 56 or y 72).
- **Strips:** the same frame edits as the office-object redo (idle squash and stretch, hurt flash and red tint, death squash, puff, cloud). Differences:
  - `silijeok_timjang` is a ghost, so its idle is a bob (0, −1, −2, −1 px) instead of a squash. It still stands on the feet line, so `flying` is false and `hoverPx` is 0.
  - Death frame 1 carries the puff and sparkles cut from the replaced boss's own death frame 1 (both executives use `cardigan_ogre`'s). Death frames 2 and 3 are that boss's cloud and fading puffs, moved to the new body centre.
- **Preview:** `monsters/preview/bosses_A_x3.png`. The top row is idle frame 0 ×3; under it each boss has one row of all ten frames ×2.
- **Known weak points:**
  - The golfer swings toward Park but his face and belly are turned three-quarters to the viewer, not in profile.
  - The vampire lawyer is the classic caped-vampire archetype, so "lawyer" comes mainly from the paper stack and red tie.

## UI icons (second batch, `icons/`)

- 20 icons at 32×32, no text:
  - `rank`, `settings`, `missions`, `timer`, `pass`, `check`, `go`, `ad`, `vip`, `vx`;
  - `buff_atk`, `buff_gold`, `buff_move`, `gear_boost`;
  - `gold_charge`, `gold_charge_big`, `premium`, `salary_pass`, `rookie_pack`, `promo_pack`.
- They were generated with PixelLab (`create_1_direction_object`, one 64-candidate batch styled from `nav_shop.png`).
- Small cleanups:
  - stray candidate-index digits removed;
  - letter-like marks on `gear_boost` and `salary_pass` painted out.
- `icons/_sheet_ui.png` is the contact sheet. `icons/extra/x_*.png` holds unused candidates.

## Aura and legend icons (`icons/`)

- 32×32, transparent, no text. `icons/_sheet_aura_legend.png` (×3) shows them, plus the speech bubble (raw and stretched as a 9-slice) and the red dot on `nav_shop`.
- Auras, one flame emblem per costume set's aura:

  | File | Aura | Picture |
  |---|---|---|
  | `aura_1` | 수습의 불꽃 | plain orange flame |
  | `aura_2` | 영업왕의 불꽃 | crimson flame with gold tips, dark outline |
  | `aura_3` | 흑기사의 불꽃 | dark purple flame with a black outline and core |
  | `aura_4` | 레인저의 불꽃 | emerald green flame |
  | `aura_5` | 성기사의 불꽃 | white holy flame with a pale blue rim and a blue sparkle |
  | `aura_6` | 회장님의 불꽃 | golden flame wearing a small crown, with sparkles |

- Legend pieces, gold and violet: `legend_helmet` (winged great helm with a violet-lit visor), `legend_armor` (gold cuirass with a violet gem and pauldrons), `legend_cape` (violet cloak with gold trim and a gem clasp), `legend_gloves` (pair of gold gauntlets with violet gems), `legend_boots` (winged gold boots with violet bands).
- Made with PixelLab `create_1_direction_object`: one 64-candidate batch at 32 px styled from `buff_atk`, `gem` and `prestige` (about 5 candidates per icon). Cleanup: binary alpha, no stray pixels were found, and near-identical colours were merged (auras 4–19 colours, legend pieces 24). Nothing was redrawn.
- The speech bubble came from a 64-candidate 24 px batch (candidate cropped, re-paletted to 5 colours, and its flat middle band extended to 24×24 exactly as a 9-slice would). The red dot is a PixelLab Pixen 16×16 image cropped to its 10×10 dot and reduced to 5 colours.

## Small icons and third batch (`icons/`)

- 16×16 small icons, drawn for that size (bold silhouette, outline, 5–14 colours): `gold_s`, `ticket_s` (cream slip with a big red stamp), `gem_s`, `coupon_s`, `pass_s` (blue pass with a gold star), `check_s`, `vx_s` (gold token with a V-shaped mark).
- 32×32: `ticket` was redone simpler and bolder (cream slip with notched ends and one big red stamp; the previous one is `icons/extra/ticket_prev.png`), `speed` (2× game speed: two yellow fast-forward chevrons) and `shop_gems` (a basket of blue gems).
- Made with PixelLab `create_1_direction_object`: one 64-candidate batch at 16 px styled from 16 px reductions of `gold` and `gem`, and one at 32 px styled from `gem` and `go`. Near-identical colours of the 16 px picks were merged; nothing was redrawn.
- `icons/_sheet_small.png` (×4) shows the 32 px currencies with the new icons, and the 16 px set below them.

## VX shop images (`vx/`)

- Square 512×512 product images without text, one per product id. They were drawn at 128×128 with PixelLab Pro Flash on a plain deep-indigo background with a soft glow, then scaled ×4 nearest-neighbour.

  | File | Picture |
  |---|---|
  | `gems_xs` | a handful of blue gems |
  | `gems_s` | a leather pouch of gems |
  | `gems_m` | an office envelope stuffed with gems |
  | `gems_l` | an open briefcase full of gems |
  | `gems_xl` | an open steel safe full of gems |
  | `gems_xxl` | the head-office vault door open on a mountain of gems and gold bars |
  | `pack_rookie` | a blue gift box with a red ribbon, a coin and a gem peeking out |
  | `premium` | a golden ticket with a star |
  | `pass_salary` | an open green bankbook with coins and a gem |
  | `pack_promo_100` | a plain white envelope with a red seal and ribbon |
  | `pack_promo_300` | a cream envelope with a red bow, a few gems and coins |
  | `pack_promo_500` | a golden envelope with a red bow and ruby seal on gems and coins |
  | `pack_promo_1000` | a jewelled royal envelope with a crown seal on a big heap of gems, coins and gold bars |

## UI frames (`ui/`)

All UI frames were generated with PixelLab (Pixen) at native size and cropped. `ui.json` holds the slice insets.

- **9-slice** (`ui.json → nineSlice`): `row_panel` (96×32, inset 6), `icon_box` (36×36, 12), `button_gold` / `button_gold_hot` / `button_disabled` (72×40, 6), `nav_tile` (56×56, 13), `nav_tile_on` (52×52, 14), `mission_panel` (48×48, 14).
  - Use CSS `border-image` with `repeat` for the centre and edges, because the fills have a fine dither texture.
- **3-slice bars** (`ui.json → threeSlice`):
  - `hp_bar_*` is 24×5. `progress_bar_*` is 80×6.
  - Each bar has three layers: `empty`, `fill` and `frame`. Left and right caps are 3 px; stretch the middle column.
  - Draw empty, then the fill clipped to the value, then the frame on top.
  - The bars were cut from one generated 3-bar sheet, keeping its outline, highlight, body and shade rows.
- **Speech bubble** (`speech_bubble.png`, 24×24, 9-slice, inset **6** on all four sides):
  - A white/cream bubble (fill `#fffdf6`, soft shade `#d6cdbb`) with a 1 px `#14110f` outline and rounded corners. The body is the full 24 px wide and 21 px tall.
  - The tail points down-left and sits entirely inside the **bottom-left 6×6 corner slice**, below the body's bottom outline. The corners never stretch, so the tail never repeats; the edges and centre are flat and stretch or repeat cleanly.
  - CSS: `border: 12px solid transparent; border-image: var(--ui-speech-bubble) 6 fill / 12px stretch;` (12px = 6 px at ×2). The body's bottom outline is 3 px above the canvas bottom, so leave that much (×scale) for the tail under the text.
  - `applyUiSkin` exposes it as `--ui-speech-bubble`.
- **Fixed size:** `menu_button` (32×32), crimson with gold corners and a three-line menu mark.
- **Boss portrait frame** (`boss_frame.png`, 40×40, fixed size, not 9-slice): dark-crimson border with a black inner ring and two curved black horns on the top corners, for the 보스 도전 button. The centre is fully transparent, a 20×20 hole at x 10–29, y 12–31 (rounded corners), so draw the boss sprite under the frame. PixelLab `create_1_direction_object`, one 64-candidate 40 px batch styled from `menu_button` and `icon_box` (25 generations); candidate 2 used as generated, alpha binarised, 50 colours.
- **Notification dot** (`red_dot.png`, 10×10, fixed size): a red dot with a `#14110f` outline, darker red lower-right shade and a short white highlight at the upper left (5 colours). It replaces the CSS-drawn red dot; place it on the icon's top-right corner at an integer scale. `applyUiSkin` exposes it as `--ui-red-dot`.
- `_preview_x1.png` / `_preview_x3.png`: a mock list (row panel + icon box + progress bar + the three button states), the HP bar, mission panel, both nav tiles and the menu button.

## Story panels (`story/`)

- Webtoon panels for the prologue in `docs/story/webtoon.md` ("프롤로그 — 명예로운 퇴직"). Each is **192×128** logical pixels, landscape, opaque, with no text, letters or UI (the game overlays the lines). Scale up only by an integer factor with nearest-neighbour.

  | File | Panel |
  |---|---|
  | `prologue_1` | Park at his desk in 총무부: the back of his monitor (plain, no notes), framed certificate, fluorescent glint on his head |
  | `prologue_2` | An HR employee in a vest and glasses hands Park a white envelope; Park laughs naively |
  | `prologue_3` | Night office: an empty desk with one box (plant, mug, pen); Park from behind, slumped |
  | `prologue_4` | Evening street at sunset: Park on the phone, sweating, forcing a smile |
  | `prologue_5` | Park bench by a pond: Park reads the newspaper, a small brown briefcase beside him, pigeons |
  | `prologue_6` | Close-up: Park's hand holds the turned-over envelope; a small red horned-circle emblem on it matches the one on the newspaper; his eyes narrow |
  | `prologue_7` | A tower piercing the clouds with the red horned emblem on top; tiny Park from behind raises one pen at the entrance, a security guard beside him |

- How they were made (PixelLab):
  1. An office-wear Park reference (`story/src/park_office_ref.png`, 64×64): Pro Flash text edit of `park/park_ref_front.png`, keeping the face, bald head, side hair and moustache and changing the tunic to a white shirt, red tie and dark trousers.
  2. Each panel: Pro Flash `create_image_pro_flash` at 192×128 with a background, using that reference as the style image (labelled as the hero Park), and the same description of Park in every prompt. Prompts asked for a calm band at the top for text.
  3. Cleanup: near-identical colours (RGB distance ≤ 6) merged, and faint lone specks inside flat areas replaced by their surroundings (4 to 32 per panel). Nothing was redrawn. Panels keep 36–86 colours each; they share the reference's outline and skin and shirt colours, but each scene keeps its own lighting (office, night, sunset, day, dusk).
  4. Raw picks are `story/src/prologue_N_raw_*.png`. Unused alternates: `alt_p2a` (plain background), `alt_p6a` (face cropped above the eyes, no bald head), `alt_p7a` (squat tower that does not reach the clouds).
- Credits: **70 generations** (1 × Pro Flash edit at 64×64 = 5, 10 × Pro Flash 192×128 = 6 each, 1 × Pro Flash 32×32 = 5 for the story icon). Panels 2, 6 and 7 were generated twice.
- Fixes after review (PixelLab Pro Flash inpaint on a crop, masked pixels only; every other pixel is unchanged). The originals are `story/src/prologue_1_v1.png` and `prologue_5_v1.png`; the inpaint outputs are `story/src/prologue_*_fix_inpaint*.png`.
  - `prologue_1`: the sticky notes were stuck on the back of the monitor. Two inpaints (96×76 crop over the notes, then a 40×64 crop over two leftovers) made it a plain dark monitor back. 1,434 pixels changed; 8 leftover yellow pixels (one speck and a small light on the base) were set to the neighbouring dark grey.
  - `prologue_5`: the dark clothes pile on the bench read as pulled-off trousers. One inpaint (64×64 crop, 28×28 mask) replaced it with a small closed brown briefcase standing on the bench. 493 pixels changed.
- Known issues: in `prologue_7` the emblem at the top of the tower is cut by the top edge, and the clouds there are busy, so text reads better at the bottom-left or over a dark box. In `prologue_3` Park is seen from behind with more side hair than usual. `prologue_6` is a larger close-up and looks coarser than the other panels.

### Episode 0.5 (`ep0_*`)

- "0.5화 — 월급만큼만 (3층)", 4 panels, same format. Setting: an early floor in the style of the 총무팀 office (grey filing cabinets, water cooler, boxes, checkered floor) with a faint purple dungeon glow at the edges.

  | File | Panel |
  |---|---|
  | `ep0_1` | Park in a tense stance, sweating, aims his pen at a big 서류 슬라임 (crumpled documents, binder clip, angry face) |
  | `ep0_2` | The slime sits at a desk staring at a small monitor with bored half-closed eyes; Park stands by, confused |
  | `ep0_3` | Close-up: Park's arm (white sleeve) bonks the slime with his pen, with an impact star; the slime's flat face doesn't care, its eyes rolled up to the wall clock |
  | `ep0_4` | Wide shot of the open-plan floor: paper slimes, a stapler bat and a clip rat each idle at their spot, zoned out; Park in the middle, deadpan |

- Monster references: frame 0 of `monsters/paper_slime_idle.png` (and of `stapler_bat_idle.png` and `clip_rat_idle.png`, described in the prompt for `ep0_4`). The style image was `park_office_ref.png` next to the paper slime frame, cropped and reduced to 24 colours so the image stays small enough to send.
- Cleanup as before (colours merged, 12–75 faint specks per panel). Nothing was redrawn. Raw picks: `story/src/ep0_N_raw_*.png`. Rejected for `ep0_3`: `alt_ep0_3_a` (both eyes squeezed shut, so the clock gag is lost) and `alt_ep0_3_b` (the slime's face and the hit are too small to read).
- Credits: **36 generations** (6 Pro Flash panels at 192×128, 6 each; `ep0_3` was generated three times). Two calls were rejected before generating because the reference image was cut off in transit, so they cost nothing.
- Known issues: `ep0_3` shows only Park's arm, not his face. The wall clock in `ep0_3` has tick marks but no hands. In `ep0_4` the stapler bat and the clip rat come from the prompt only, so they look a little different from their game sprites.

### Episode 1 and the headhunter (`ep1_*`, `hunter_*`)

- Episode "1화 — 상무님은 부재중 (100층)" (6 panels) and "1화 뒤 — 헤드헌터 (100층)" (4 panels), same format as the prologue.

  | File | Panel |
  |---|---|
  | `ep1_1` | Floor 100 boss room (an executive office turned dungeon: wood panels, filing cabinets, green torches, purple runes); a huge shadow with red eyes looms over the desk; tiny Park from behind |
  | `ep1_2` | Park trembles, sweat flying, and points his pen at the shadow falling across the room |
  | `ep1_3` | Reveal: a flat cardboard standee of a stern grey-haired executive with a blank scribbled sign on a string; a lit phone on the floor behind it; Park stares, blank-faced |
  | `ep1_4` | Park leaps in and smacks the standee with his pen: impact star, action lines, the standee folds back, the phone flies |
  | `ep1_5` | Beside a photocopier in a cobwebbed corner, gaunt 김인턴 crawls out on all fours; Park looks down in surprise |
  | `ep1_6` | 김인턴 with starry hopeful eyes and clasped hands; Park looks away with a sweat drop and a guilty smile (his name badge is blank) |
  | `hunter_1` | Concrete stairwell landing: 헤드헌터 냥 (grey tabby in sunglasses and a navy suit) leans on the rail and holds out a blank business card; Park, from behind, stops on the stairs |
  | `hunter_2` | Close-up: Park, jaw dropped, eyes bulging, an anger mark on his head, pointing at himself |
  | `hunter_3` | The cat spreads a hand of exam tickets (cream cards, each with a red stamp, like `icons/ticket.png`) like playing cards; Park leans in |
  | `hunter_4` | Park holds a few tickets and studies them with a deadly serious frown |

- Character references (64×64, transparent, in `story/src/`), made first so they can be reused in later episodes:
  - `ref_kim_intern.png`: 김인턴, gaunt, messy black hair, eye bags, wrinkled light blue shirt, lanyard ID (Pro Flash with `park_office_ref.png` as the style image).
  - `ref_headhunter_cat.png`: 헤드헌터 냥, grey tabby standing upright, black sunglasses, navy suit, white shirt, thin black tie (Pro Flash, same style image).
  - `ref_executive_standee.png`: the stern grey-haired executive on the standee (Pixen, 1 generation). It is a plain figure, not a cardboard cutout; the panels draw the cutout from the prompt.
- Panels with two characters used a composite style image: `park_office_ref.png` placed next to the other reference (and `icons/ticket.png` for `hunter_3` and `hunter_4`), labelled "left: Park, right: …". Single-Park panels used the Park reference alone.
- Cleanup as for the prologue (colours merged, 13–47 faint specks per panel). In `hunter_1` the green emergency sign had letter-like white marks; those 46 pixels were painted the sign's green. Nothing else was redrawn.
- Raw picks: `story/src/{ep1,hunter}_N_raw_*.png`. Rejected: `alt_ep1_2a` (Park in a jacket, and a horned demon sat at the desk, which spoils the cardboard reveal) and `alt_hunter_3a` (the tickets read as a paper hand fan).
- Credits: **98 generations** in this batch: 3 references (5 + 5 + 1), 12 Pro Flash panels at 192×128 (6 each; `ep1_2` and `hunter_3` were generated twice) and 3 Pro Flash inpaints for the prologue fixes (5 each).
- Known issues: `ep1_6` is lit like a plain beige office rather than the dark dungeon room, so it differs from `ep1_1`–`ep1_5`. In `ep1_1` and `hunter_1` Park is small and seen from behind. In `ep1_3` Park is cut by the left edge.

### Episodes 2 and 3 (`ep2_*`, `ep3_*`)

- "2화 — 네트워크 마케팅 아닙니다 (300층)" and "3화 — 내용증명 (600층)", 4 panels each, same format as the prologue. `story/_sheet_ep2.png` and `_sheet_ep3.png` show them ×2 in reading order (same layout as `_sheet_prologue.png`).

  | File | Panel |
  |---|---|
  | `ep2_1` | 영업팀 floor (desks, rising bar-chart posters): Park in front of a glowing gear vending machine (giant stapler, pen, mug), his face and head drained pale blue-white, jaw dropped |
  | `ep2_2` | Park, arms crossed and unimpressed, as 박주임 bursts in with a big sparkling showman pose |
  | `ep2_3` | Close-up: 박주임 grins and waves a fan of green banknotes, bills fluttering, his gold watch glinting |
  | `ep2_4` | Park and 박주임 arm in arm, grinning, 박주임 giving a thumbs up; 김인턴 peeks from behind a partition with narrowed, suspicious eyes |
  | `ep3_1` | Floor 600 courtroom (judge's bench, candles, purple gloom): the 법무 상무 lich in wig and robe leans over the bench with its gavel; small Park at the bottom left, sweating, gripping his pen |
  | `ep3_2` | A sheet of paper slaps flat onto the lich's face; motion lines, the gavel flies up, the lich flails (the sheet has only grey scribble lines) |
  | `ep3_3` | Close-up: 최대리 pushes up her glasses (white glint hides her eyes), a folder and a fan of papers in her other arm, papers drifting |
  | `ep3_4` | Paper blades shred the lich and the red health bar above it; in front, Park with starry eyes and clasped hands, 최대리 cool with arms folded and eyes closed |

- New character references (64×64, transparent, binary alpha, in `story/src/`), for later episodes:
  - `ref_park_jumim.png`: 박주임, gelled swept-back black hair, big grin, shiny grey suit, dark tie, gold watch, a fan of green banknotes (Pro Flash, `park_office_ref.png` as the style image).
  - `ref_choi_daeri.png`: 최대리, black chin-length bob, rectangular glasses, navy blazer and skirt, white blouse, a dark blue folder at her chest. Pro Flash with the same style image, then one Pro Flash text edit to add the folder (the first try had none; a second fresh try had the folder but a muddier face).
  - The lich has no separate reference: the panels used `monsters/judge_lich_idle.png` frame 0 (80×80).
- Style images: the same composite approach as episode 1. Each reference was cropped to its bounding box and placed side by side, bottom-aligned, 4 px apart: Park + 박주임 (`ep2_2`), Park + 박주임 + 김인턴 (`ep2_4`), Park + lich (`ep3_1`), Park + 최대리 + lich (`ep3_4`). Single-character panels used that character's reference alone. Prompts repeat the same description of Park.
- Two panels were fixed with a Pro Flash text edit of the whole 192×128 panel:
  - `ep2_1`: the first roll had Park shocked but not pale, and a plain white strip across the top. The edit made his face pale and continued the ceiling. A second fresh roll (`src/alt_ep2_1b.png`) was paler but showed "$$$" on the price display and lost Park's tie.
  - `ep2_4`: 김인턴 looked neutral; the edit gave him the suspicious squint.
- Cleanup as for the prologue (colours merged at RGB distance ≤ 6, 0–36 faint specks per panel; 29–79 colours per panel). `ep3_2` and `ep3_4` came back with a flat grey bottom row (a grid-recovery artefact), which was replaced by a copy of the row above. Nothing was redrawn.
- Raw picks: `story/src/{ep2,ep3}_N_raw_*.png`. Rejected: `alt_ep2_1b` (see above) and `alt_ep3_4a` (Park and 최대리 tiny at the left, expressions hard to read).
- Credits: **92 generations**: 박주임 reference 5; 최대리 reference 15 (2 Pro Flash 64×64 creates and 1 edit, 5 each); 10 Pro Flash panels at 192×128 (6 each; `ep2_1` and `ep3_4` rolled twice); 2 Pro Flash edits at 192×128 (6 each).
- Known issues: `ep3_3` is a large close-up with longer, less chibi proportions than the 최대리 reference, like `prologue_6`. In `ep3_1` Park is small and cut by the bottom edge. In `ep3_4` the lich is half hidden by the paper storm and reads mainly by its wig. The mug in `ep2_1` has a small blue logo mark (no letters).

### Episodes 4 and 5 (`ep4_*`, `ep5_*`)

- "4화 — 구독과 좋아요 (900층)" (4 panels) and "5화 — 김팀장 (1000층, 근속 25년 금배지)" (5 panels), same format as the prologue. `story/_sheet_ep4.png` shows episode 4 ×2 in one row (like `_sheet_ep2.png`); `_sheet_ep5.png` shows episode 5 ×2 in rows of three (like `_sheet_ep1.png`).

  | File | Panel |
  |---|---|
  | `ep4_1` | Dungeon floor with torches and broken cubicles: Park punches a purple slime (impact star) while a selfie stick with a phone pokes in from the top right; Park glances at it, startled |
  | `ep4_2` | 공주임 intro: winking idol pose, peace sign, selfie stick up, in front of a pink burst with stars and sparkles |
  | `ep4_3` | Park, eyes squeezed shut and crying out, waves both hands at the camera, sweat drops and motion lines; the phone on its stick in the right foreground |
  | `ep4_4` | Close-up of a phone held sideways by two hands in pink sleeves: on screen, a blushing Park with three buff icons above his head (red sword, blue shield, green up arrow) and a column of blank comment bubbles, each with only a small heart; hearts and sparkles float out of the screen |
  | `ep5_1` | Floor 1000 boss room (red torches, banners with a horned emblem): a mountain of approval papers, folders and binders, sheets flying; on top, the boss with grey hair from behind; tiny Park from behind at the bottom left |
  | `ep5_2` | Reveal on the paper piles: 김팀장 in his brown suit, glasses, pauldron, bracers and blank badge stands calm and weary; Park recoils, shocked |
  | `ep5_3` | After the fight, papers all over the floor: 김팀장 sits on the floor, hair messed up, and holds out the small round gold pin on his palm; Park kneels and reaches for it |
  | `ep5_4` | Chest-up Park, stern, the gold pin in his fist at his chest; 김팀장 sits at the right edge, looking away |
  | `ep5_5` | From behind, Park and 김팀장 (hand on Park's shoulder) at the foot of a zigzag stone staircase that climbs into darkness, a few torches along it |

- New character references (64×64, transparent, binary alpha, in `story/src/`), for later episodes:
  - `ref_gong_jumim.png`: 공주임, long dark brown hair with a pink ribbon clip, bright open smile, pastel pink cardigan over a white blouse, grey skirt, blue ID lanyard, a selfie stick with a black phone.
  - `ref_kim_teamjang.png`: 김팀장 as the floor 1000 boss, grey slicked-back hair, heavy jowls, black-framed glasses, rumpled brown suit and dark tie, a dull iron pauldron on one shoulder and iron bracers, a blank contract-worker ID badge on the chest pocket.
  - Both are Pro Flash 64×64 with `park_office_ref.png` as the style image (proportions, outline and shading only). Each was rolled twice and the clearer one kept.
  - The 금배지 has no separate reference: it is a small round gold pin with no letters in `ep5_3` and `ep5_4`.
- Style images: Park's reference and the new character's reference side by side in one 128×64 image, labelled "left: Park, right: 공주임" or "right: 김팀장". Episode 4 used Park + 공주임 and episode 5 used Park + 김팀장 for every panel. Prompts repeat the same description of Park.
- Cleanup as for the prologue (colours merged at RGB distance ≤ 6, 9–38 faint specks per panel; 89 in `ep4_3`, all in the carpet noise; 28–84 colours per panel). `ep5_3` and `ep5_4` came back with a flat light bottom row (the grid-recovery artefact), which was replaced by a copy of the row above. Nothing was redrawn.
- Raw picks: `story/src/{ep4,ep5}_N_raw_*.png`. Rejected rolls were not kept: one `ep4_1` with no characters at all and one with Park running from the slime; three `ep4_4` with Park and the buff icons but no phone.
- Credits: **110 generations**: 4 Pro Flash 64×64 references (5 each) and 15 Pro Flash panels at 192×128 (6 each; `ep4_1` was rolled 3 times and `ep4_4` 5 times; the other panels once).
- Known issues: in `ep5_1` and `ep5_5` Park is seen from behind, and in `ep5_1` he is small and tinted red by the torchlight. `ep5_3`, `ep5_4` and `ep5_5` have a flat dark band across the top (asked for as caption space), and `ep4_4` a nearly flat one. `ep5_4` is a larger close-up of Park, so it looks coarser, like `prologue_6`. In `ep5_3` 김팀장's hair is messier than in his reference (after the fight).

## Story icon (`icons/story.png`)

- 32×32, transparent, binary alpha, no letters: an open comic book with small picture panels on both pages and a red bookmark ribbon, for the 스토리 menu.
- PixelLab Pro Flash 32×32 with `icons/missions.png` as the style image (5 generations, included in the count above). Used as generated.
