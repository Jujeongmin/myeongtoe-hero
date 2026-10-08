# 명퇴용사 박부장: art assets

> **2026-10-07 cleanup:** every file the game does not load was deleted (raw picks and alternates in `*/src/`, contact sheets `_sheet_*.png`, old and preview folders, single animation frames, the webtoon style test): 869 files, about 10.7 MB. Sections below still describe how those files were made; they are in git history before this commit. All remaining PNGs were re-saved losslessly (palette PNG where a picture has 256 colours or fewer): 3.4 MB to 1.7 MB.

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
| `fx/hit_spark.png`, `fx/crit_spark.png`, `fx/hit_fx.json` | Hit-impact bursts for Park's hits on monsters: normal (5 frames, 32×32) and critical (6 frames, 48×48). `fx/_sheet_hit.png` is the preview and `fx/src/` holds the raw generations. See Hit sparks. |
| `parts/old_suits/` | The first office-suit parts. They fit only `park/old/` and are kept for reference. |
| `parts/old_suits_v2/` | The previous code-drawn fantasy parts, replaced by the current ones. Kept for reference. |
| `parts/gear/g00..g29.png` | 30 hand-held office items (업무 장비), each at most 24×24, drawn upright. |
| `parts/gear/scaled/` | Pixel-clean, pre-shrunk copies of the bulky items (see `scale`). |
| `parts/gear/gear.json` | Grip point, default angle and scale of each item. |
| `backgrounds/*.png` | 7 department battle backgrounds (부서 배경), 320×96, opaque, tile horizontally. |
| `parking/chest.png`, `parking/_sheet.png`, `parking/old/` | The 지하주차장 dungeon: the treasure-toolbox strip, a preview sheet, and the previous `bg_parking.png`. See Parking dungeon. |
| `icons/*.png` | UI icons, 32×32, plus 16×16 small icons named `*_s.png`. `icons/_sheet.png`, `_sheet_ui.png`, `_sheet_small.png` and `_sheet_aura_legend.png` are contact sheets. |
| `vx/*.png` | 13 VX shop product images, 512×512 (128×128 pixel art scaled ×4 nearest-neighbour). The 128 px sources are in `vx/src/`, and `vx/_sheet.png` shows all of them. |
| `icons/extra/`, `parts/gear/extra/` | Unused extras left over from generation. They can be deleted. |
| `story/prologue_1..7.png`, `story/ep0_1..4.png`, `story/ep1_1..6.png`, `story/hunter_1..4.png`, `story/ep2_1..4.png`, `story/ep3_1..4.png`, `story/ep4_1..4.png`, `story/ep5_1..5.png`, `story/ep6_1..4.png`, `story/ep7_1..4.png`, `story/ep8_1..4.png`, `story/ep9_1..4.png` | Webtoon panels (prologue, episodes 0.5–9, headhunter), 192×128, opaque, no text. `story/_sheet_prologue.png`, `_sheet_ep0.png`, `_sheet_ep1.png`, `_sheet_hunter.png`, `_sheet_ep2.png` to `_sheet_ep9.png` show them ×2 in reading order; `story/src/` holds the raw picks, unused alternates and the character references. See Story panels. |

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

## Hit sparks (`fx/`)

- One-shot bursts drawn on the monster where Park's item lands. Transparent, binary alpha, no text. Frame *i* of each strip is at x = frameWidth·i.

  | File | Frames | Size | ms per frame | Anchor | Frames in order |
  |---|---|---|---|---|---|
  | `hit_spark.png` | 5 | 32×32 | 45 | [16, 16] | a tiny white-yellow flash; the big yellow star with a white-hot core, 3 speed lines on the left and 2 white paper scraps; the star breaking into shards; a few yellow specks and one paper scrap; two specks |
  | `crit_spark.png` | 6 | 48×48 | 50 | [24, 24] | a hot red-orange flash; a big jagged crimson-orange-gold starburst with speed lines and paper confetti; the starburst inside a thin gold shockwave ring, more confetti; the burst shattering into eight shards, the ring broken into arcs; fading orange specks and four paper scraps; nearly empty (one speck and the last scraps) |

- `hit_fx.json` holds the same data. The anchor is the centre of the burst, so draw frame *i* at hit point − anchor.
- The star, shards and paper have the game's near-black outline `#0C0B0A`, so they read on dark and light floors. The small fading specks and the crit's gold ring have no outline. Palettes: 24 colours (hit), 32 colours (crit).
- `_sheet_hit.png`: every frame ×3, hit on top and crit below, each on a dark and a light background.
- **How they were made (PixelLab Pro Flash, no hand drawing):**
  - Each strip was generated as one image of side-by-side frames, so the frames share one drawing and style. The style image was `icons/speed.png`, `gold.png` and `buff_atk.png` side by side (hit); for the crit it was two frames of the hit strip next to `buff_atk.png`, and for the crit's second half the crit's own frames 2–3.
  - Hit: one 160×32 image of 5 cells; the frames came out inside their cells. Frames 3 and 4 were moved 2 and 3 px left so their centre lines up with the star.
  - Crit: 6 × 48 px is wider than Pro Flash allows (256), so it was made as two 144×48 images of 3 frames. Frames 1–3 are one image (`src/crit_spark_raw_a.png`). Frames 4 and 6 are from `src/crit_spark_raw_b.png` (its third cell came back empty), and frame 5 from `src/crit_spark_raw_c.png` (its first frame was cut by the left edge), both made with the same prompt and style image. Each frame was cut out whole and centred on its burst centre; no pixel was lost or moved within a frame.
  - Cleanup: near-black colours (no channel above `0x30`) snapped to `#0C0B0A`; then the closest pair of colours was merged into the more common one until 24 (hit) or 32 (crit) remained. Alpha was already binary.
  - The raw images are in `fx/src/` (`hit_spark_raw.png`, `crit_spark_raw_a/b/c.png`).
- Known issues: the crit's first frame is a 23 px flash, bigger than the hit's tiny flash. The crit's frames 5 and 6 come from two different images, so their paper scraps are not at the same spots.

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

`bg_parking.png` was redrawn for the 지하주차장 dungeon (see Parking dungeon); its floor starts at about y 64.

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

- **Parking dungeon (PixelLab):** about **161 generations**: 4 × Pro text-to-image 320×96 / 320×64 backgrounds (25 each, all rejected for perspective or zoomed-in framing), 4 × Pixflux img2img (1 each, one used), 2 × Pro Flash background inpaints (6 each), 1 × 16-candidate monster batch (20), 1 × 64-candidate chest batch (20) and 1 × Pro Flash chest inpaint (5). Other sessions used the same account at the same time, so the balance drop was larger.
- **Hit sparks (PixelLab Pro Flash):** **60 generations**, 10 images at 6 each. Hit: 4 images at 160×32 (one more failed in background removal and was not charged); the first two had frames crossing their cells or no flash, the third had no speed lines, the fourth was used. Crit: 6 images, a 144×96 3×2 grid that came back as treasure chests, then 144×48 halves: a swirl, a blue burst (palette not copied), the used first half, and two second halves that were both used in part.
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

- There are 36 floor monsters, 6 per department background, plus the 4 normal monsters of the 지하주차장 dungeon (see Parking dungeon). Each floor department has:
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

### Humanoid bosses (batch B)

Five more bosses were redrawn the same way, as cursed office workers first. They are new ids. Their entries are in `monsters/new_bosses_B.json` (`monsters` plus a `replace` map from old id to new id) and are not yet merged into `monsters.json`. The old strips are copied to `monsters/old/`.

| id (replaces) | Name | Role, department | Picture | Body (w×h) |
|---|---|---|---|---|
| `deadline_timjang` (`server_golem`) | 데드라인 좀비 개발팀장 | teamLeader, 개발팀 | a grey-green zombie developer with dark eye circles, a grey hoodie half up behind a glowing cyan headset, a red energy-drink can held out, and a laptop under his arm whose screen glows red (no text) | 46×50 |
| `legacy_sangmu` (`legacy_hydra`) | 레거시 사이보그 개발 상무 | executive, 개발팀 | a balding old executive in a brown cardigan and red tie, a beige PC tower with vents and a floppy slot bolted to his back, his front arm a hanging bundle of coloured cables, and a green monocle screen over one eye | 58×66 |
| `jeoseung_timjang` (`safe_mimic`) | 저승사자 재무팀장 | teamLeader, 재무팀 | a Korean-style reaper finance manager: a wide black gat, a black suit and tie, a deathly pale face, a black ledger under one arm and a tall red fountain pen dripping red ink, held like a scythe | 43×52 |
| `sujeonno_sangmu` (`gold_dragon`) | 황금 수전노 재무 상무 | executive, 재무팀 | a hunched bald old executive in a navy suit studded with gold coins, glowing yellow eyes and a gold-toothed grin, hugging a money sack over a heap of gold coins | 67×64 |
| `nakhasan_jeonmu` (`pen_demon`) | 낙하산 전무 | teamLeader, 임원실 | a smug young executive with slicked black hair, a slim navy suit and red tie, small red horns and a pointed tail, a parachute pack with a red-and-white canopy half open behind him, and a big fountain pen held upright like a trident | 50×52 |

- **Generation:** PixelLab `create_1_direction_object` (sidescroller view), 16 candidates at 80×80 per call, with `golf_minotaur` and `megaphone_orc` idle frame 0 as style references. Every boss got one call. Re-rolls:
  - the zombie got two more, for a hood that sits half up and a laptop screen that visibly glows red;
  - the cyborg got two more, because the first back-mounted computers had logo-like marks or a screen shaped like a well-known computer;
  - the reaper got one more, for a human face instead of a skull-like one;
  - the miser got one more, for coins on the suit and a bigger coin heap.
  - All picks already faced west.
- **Downscale:** the same as the office-object redo (crop, ×4 nearest-neighbour, kCentroid to the body height, binary alpha, a median cut to 26 colours, the darkest colours snapped to `#0C0B0A`). Heights are 50–52 px for team leaders and 64–66 px for executives. Each sprite is centred on its canvas with its feet on y 56 or y 72.
- **Strips:** the same frame edits as the office-object redo. Death frame 0 is 105 % wide (as in the old boss strips). Death frame 1 carries the small puff and sparkles common to the replaced bosses of that role (`copier_golem`, `server_golem` and `safe_mimic` for team leaders; `cardigan_ogre`, `judge_lich`, `legacy_hydra` and `gold_dragon` for executives). Death frames 2 and 3 are `copier_golem`'s or `cardigan_ogre`'s cloud and fading puffs, moved to the new body centre.
- **Preview:** `monsters/preview/bosses_B_x3.png`. The top row shows idle frame 0 ×3 on each department background. Under it, each boss has one row of all ten frames ×2.
- **Known weak points:**
  - The reaper reads as a reaper first. "Finance" comes only from the small dark ledger and the red pen.
  - The miser's money sack carries a small `$` sign.
  - The team leaders are narrower (43–50 px) than the blocky bosses they replace (54–60 px).

### Parking dungeon (지하주차장)

The 지하주차장 dungeon uses the same battle screen as the floors: a new `bg_parking.png`, four normal monsters and a treasure chest. In `monsters.json` the department is `parking` (`departments[6]`, after 임원실). It has no bosses of its own, so `teamLeader` is `tire_golem` and `executive` is `car_mimic`, only to keep the shape.

| id | Name | Flying | Picture | Body (w×h) |
|---|---|---|---|---|
| `cone_slime` | 고깔 슬라임 | no | a teal jelly slime wearing a tilted orange-and-white traffic cone, eyes looking west | 27×34 |
| `tire_golem` | 타이어 골렘 | no | a squat golem of stacked black tires with stubby tire arms and yellow eyes in the gap | 37×34 |
| `ticket_ghost` | 주차딱지 유령 | yes (`hoverPx` 6) | a ghost made of a yellow parking ticket with blank print lines, a curled top and a grey wisp tail | 30×34 |
| `car_mimic` | 경차 미믹 | no | a tiny boxy light-green city car facing west, headlight eyes and a toothy grille mouth with a red tongue | 41×31 |

- **Background (`backgrounds/bg_parking.png`, 320×96, 40 colours):** a flat side view of the garage: a ceiling pipe, four pillars with a coloured round or triangular marker (shapes and arrows, no letters or numbers) and yellow-black hazard stripes, two dim ceiling lights with pale light cones, a red and a teal car parked side-on in two bays, one empty bay with an oil stain, and a dark concrete floor from about y 64 with yellow bay marks and a yellow lane line.
  - Made with PixelLab Pixflux img2img (init strength 100) from a hand-drawn flat layout sketch, because Pro text-to-image kept zooming in (pillars to the bottom edge, floor only 6–16 px tall). The colours were cut to 40 (median cut) and graded darker and bluer (value ×0.84, saturation ×0.88, 10 % toward a dark blue-grey; the tube highlights were kept).
  - Two Pro Flash inpaints on 128×96 crops then fixed it: one removed a third (green) car, leaving the empty bay, and one redrew the band across the left/right edge (with the image rolled by 160 px) as a ceiling light with a centred cone, so the picture tiles seamlessly. Outside both masks the pixels are unchanged.
  - The warning-triangle marker had a dark `!`-like mark inside; it was filled with the triangle's own yellow by script.
  - The previous background is kept in `parking/old/bg_parking.png`.
- **Monsters:** one PixelLab `create_1_direction_object` batch (sidescroller, 16 candidates at 64×64, four descriptions per monster), with `keyboard_mimic` and `calc_crab` idle frame 0 as style references. The picks already faced west. Downscale, palette and strips are the same as the office-object redo, with two differences:
  - The palette is the pick's own colours merged pairwise down to 25 plus `#0C0B0A` (as in boss batch A), because a median cut lost the tire golem's yellow eyes.
  - The death puff and cloud come from the nearest body-width group with at least two normal monsters (31 for the slime and the ghost, 36 for the golem, 41 for the car), because a one-member group would carry that monster's own body.
- **Chest (`parking/chest.png`):** a strip of 4 frames, 32×32 each (frame *i* at x = 32·i): closed, lid half open with gold light leaking, lid open with a golden burst and sparkles, open and empty. Anchor: bottom centre (16, 32); the box sits on the bottom row (y 31) in every frame. 40 colours, binary alpha.
  - The closed red toolbox (gold latch, black handle) was picked from one 64-candidate `create_1_direction_object` batch at 32 px (the candidates came back on a 10×10 grid, so the sheet was stitched back together and the toolbox cut out). Stray pixels were cleaned and the palette merged to 16 colours.
  - The other three frames are one Pro Flash inpaint of a 2×2 sheet of the closed box, masking only the lid and the space above it in three cells. The box body below the lid seam is pixel-identical in all four frames.
- **Preview:** `parking/_sheet.png` (×3): Park and the four monsters (idle frame 0) on the background, floor line 82, and under it the four chest frames on the floor.
- **Known weak points:** the tire golem is dark on a dark background (its grey rims and yellow eyes carry it).

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

- 16×16 small icons, drawn for that size (bold silhouette, outline, 5–14 colours): `gold_s`, `ticket_s` (cream slip with a big red stamp), `gem_s`, `pass_s` (blue pass with a gold star), `check_s`, `vx_s` (gold token with a V-shaped mark).
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
- **Currency counter** (`wallet_pill.png`, 40×24, 9-slice, inset **8** on all four sides): a dark inset counter for panel headers (`[gem icon] 156`), with a bevelled gold-bronze rim, rounded ends, a light top rim and a 1 px `#0c0b0a` line around a flat navy-black well `#1e2332` for bright numbers. Binary alpha, `#0c0b0a` outline, no text; the rounded ends and the top-left glint stay inside the corner slices, and the edge bands and centre repeat cleanly. PixelLab `create_1_direction_object`, one 64-candidate 40 px batch styled from `ranking_row`, `costume_button` and `ranking_button` (25 generations, no re-roll); candidate 15 (raw in `ui/src/wallet_pill_raw.png`) cropped to 36×24, outer edge set to `#0c0b0a`, edge bands set to their most common cross-section, centre flattened, middle widened to 40. `_sheet_wallet.png` shows it at ×1, stretched to 120×32 (plain and with `gem_s`), and ×4 / ×2 / ×4, on dark and light backgrounds.
- `_preview_x1.png` / `_preview_x3.png`: a mock list (row panel + icon box + progress bar + the three button states), the HP bar, mission panel, both nav tiles and the menu button.
- **이직 (job change) frames**, all 9-slice (`ui.json → nineSlice`), binary alpha, dark outline, no text:

  | File | Size | Slice | Look |
  |---|---|---|---|
  | `prestige_button` | 48×32 | 8 | deep teal-green leather briefcase, stitched seams, brass corner plates |
  | `prestige_button_on` | 48×32 | 8 | the same frame in bright glowing mint teal (job change available) |
  | `prestige_panel` | 48×48 | 12 | cream offer-letter paper, gold double-line border, small red seal in the bottom-right corner slice; flat paper centre `#e2d5b5` |
  | `prestige_card_plain` | 36×36 | 10 | navy and silver; flat grey-blue centre `#89abb9` |
  | `prestige_card_boosted` | 36×36 | 10 | gold; flat warm paper centre `#f3d3a3` |
  | `prestige_card_super` | 36×36 | 10 | royal purple with gold trim and gold sparkles in the corners; flat lavender centre `#dccdee` |

  - Made with PixelLab Pixen (`create_image_pixen`) at native size, one generation per roll. Raw picks are in `ui/src/prestige_*_raw.png`.
  - Cleanup: alpha binarised, near-identical colours merged, the centres flattened to one paper colour, and each edge band made periodic (1–2 px) so it repeats without seams. Corner details stay inside the corner slices.
  - The panel's grey rim and gold line were swapped (grey → gold, gold → dark ochre) to give the gold double line. `prestige_button` is `prestige_button_on` with its teal darkened; the purple card's centre was transparent after background removal and was filled with lavender.
  - `_sheet_prestige.png`: each frame at ×4, the buttons stretched to 160×48, the panel stretched to 300×400 holding the three cards (268×104), and some other stretches (all ×2).

### Themed menu panels

Each menu has its own frame set instead of the shared blue row panel. Every theme has `<theme>_panel` (48×48, slice 12, the whole sheet), `<theme>_row` (36×36, slice 10, one list row), `<theme>_button` and `<theme>_button_hot` (32×24, slice 8; `_hot` = highlighted/affordable). All are 9-slice in `ui.json → nineSlice`, binary alpha, `#0c0b0a` outline, no text, `repeat` safe: the edge bands are one repeated cross-section and the centres are one flat colour, and every ornament sits inside a corner slice.

| Theme | Panel | Row | Button / hot | Panel centre |
|---|---|---|---|---|
| `costume` (wardrobe) | dark polished wood, gold coat hooks in the corners | dark red velvet cushion, bevelled frame, gold tacks | gold-trimmed wood plaque with studs / red velvet plaque with a gold glint | dark red `#7a0e19` |
| `apartment` | honey-wood trim, beige wallpaper, tiny door in the bottom-right corner | cream card, honey-wood edge | wooden door-plate / warm orange door-plate | light beige `#d2be99` |
| `relics` (memento cabinet) | dark mahogany, brass corner plates, glass shine top-left | brass-rimmed dark wood slot | dull brass nameplate / polished gold nameplate with screws | dark `#321717` |
| `office` | steel desk metal, bolts in the corners, dark green desk mat | thin steel frame, paperclip on the top-left corner | grey keycap / lit amber keycap | dark green `#446951` |
| `missions` (clipboard checklist) | brown wooden clipboard, steel clip in the top-left corner, cream ruled paper, dog-ear bottom-right | cream checklist note, empty checkbox top-left, ruled line along the bottom, dog-ear | dark crimson approval-stamp plate / bright red stamp plate with white glints | light cream `#f1e5c3` with ruled lines |
| `ranking` (trophy board) | navy-black board, bronze trim, gold laurel sprigs in the corners | engraved navy plate, gold-bronze bevel, gold screws | burnished gold medal plate / bright polished gold plate | dark `#131522` |
| `settings` (control panel) | matte charcoal plastic, screw in each corner, tiny green LED top-right | recessed charcoal switch strip with a lighter bottom lip | grey rocker switch in a bezel / green-lit rocker switch | dark charcoal `#2d313c` |
| `story` (comic book) | cream cover, bold 2 px black ink border, halftone triangles in the corners | comic panel strip: double ink border, white gutter, halftone top-left | white speech bubble (tail in the bottom-left corner) / yellow POW burst, spikes in the corners | light cream `#f5eddb` |

- Odd ones: `office_button` / `office_button_hot` use a **bottom slice of 11** (top/left/right 8), because the keycap's front bevel lives at the bottom. `office_row`'s paperclip rises 3 px above the frame, so its top 3 rows are transparent apart from the clip. `relics_panel`'s brass plates stick out 1 px past the wood, so each edge has a 1 px transparent margin.
- Made with PixelLab `create_1_direction_object` (sidescroller view, 48 px, 16 candidates per batch, one item description per candidate). 7 batches, **140 generations**: costume 1, apartment 3 (the first had no outlines; one of the re-rolls was styled from the costume picks, the used one was not), relics 2 (the re-roll styled from the first batch), office 2 (the panel/row re-roll styled from the first batch's keycaps).
- Cleanup (scripts not kept): alpha binarised, near-black outline set to `#0c0b0a`, enclosed transparent gaps filled from the inside colour, frames cut to size by removing or repeating middle rows/columns, edges made uniform and centres flattened.
- Hand fixes: `apartment_panel`'s door was moved 1 px down (one door row dropped) to fit the corner; `office_row`'s paperclip lost its 1 px shadow column to fit the 10 px corner; the office keycaps ran off the canvas, so each is its complete right half mirrored, with pin-holes filled and the front bevel shortened; the relics cabinet ran off the canvas, so `relics_panel` is its top-right quadrant mirrored both ways, with a short glass-shine streak redrawn in the top-left corner in the generated shine colours.
- Previews: `_sheet_costume.png`, `_sheet_apartment.png`, `_sheet_relics.png`, `_sheet_office.png`, each frame at ×1 and ×4, then stretched at 1 px per pixel (panel 300×360, row 300×56, buttons 90×40), the whole sheet at ×2.
- `missions`, `ranking`, `settings`, `story` (all plain slices 12 / 10 / 8 / 8):
  - Odd ones: `missions_panel`'s clip rises 2 px above the board, so its top 2 rows are transparent apart from the clip; its centre is not flat but cream with 1 px ruled lines every 6 rows (period 6, so the 24 px centre and the side edges repeat without seams). `story_button`'s body ends 3 px above the canvas bottom; the small tail sits in the bottom-left corner slice (x 4–7), like `speech_bubble`. `story_button_hot`'s spikes poke out only in the corner slices.
  - Made with PixelLab `create_1_direction_object` (sidescroller view, 40 px, 64 candidates per batch, 32 item descriptions per batch). 6 batches, **150 generations**: missions 1, ranking 1, settings 1, story 3 (the first two drew comic frames that ran across the cell borders; the third was styled from three clean picks of the first two and is the one used).
  - Cleanup (script not kept): alpha binarised, frames cut to size by keeping the corners and repeating or trimming the middle, each edge band set to its most common cross-section and each centre to one flat colour, the outer outline set to `#0c0b0a`.
  - Hand fixes: the clipboard's clip was moved from the top centre into the top-left corner (2 middle columns dropped so it fits in 12 px) and the board under it filled from the plain top edge; the paper's uneven ruled lines were redrawn every 6 rows in the generated line colour. `story_panel` got a second inner black line for a bold border, and its paper specks were merged into the cream. `story_row`'s transparent gap between the two borders was filled with white and its halftone cut to a triangle inside the 10 px corner. `story_button`'s tail was too wide for the 8 px corner, so it was redrawn smaller in the bubble's own colours.
  - Previews: `_sheet_missions.png`, `_sheet_ranking.png`, `_sheet_settings.png`, `_sheet_story.png`: each frame at ×4 on the left; on the right, stretched to panel 300×360, row 300×56, buttons 90×40 at 2 px per pixel (a 150×180 / 150×28 / 45×20 frame drawn ×2).

## Story panels (`story/`)

- Webtoon panels for `docs/story/webtoon.md`. Each is **192×128** logical pixels, landscape, opaque, with no text, letters or UI (the game overlays the lines). Scale up only by an integer factor with nearest-neighbour.

### Prologue (`prologue_*`): "프롤로그 — 나이 무관"

  | File | Panel | Speaker head points [x, y] |
  |---|---|---|
  | `prologue_1` | Park bench; Park in shirt and tie with a laptop whose screen is a grid of red X stamps | (narration) |
  | `prologue_2` | Laptop close-up: a job-ad layout of grey bars around a glowing red horned-circle emblem; Park's face peeks in at the right | 박부장 [172, 6] |
  | `prologue_3` | The tower rising through the clouds, red emblem on top; Park at the entrance with a résumé envelope, straightening his tie | 박부장 [92, 63] |
  | `prologue_4` | Interview room: 서류 슬라임, 스테이플러 박쥐 and 결재 강시 총무 상무 behind a desk; Park on the edge of a chair | 서류 슬라임 [32, 42], 박부장 [155, 47] |
  | `prologue_5` | The 강시 상무 slams a red approval stamp (round red mark, no letters); Park stunned | 결재 강시 총무 상무 [128, 23], 박부장 [22, 40] |
  | `prologue_6` | HR counter: a small box with one pen; Park holds up a blank ID card with a shield-figure emblem; a smiling HR staffer with a tablet | 박부장 [72, 22], 인사팀 [150, 24] |
  | `prologue_7` | Evening outside an apartment complex; Park on the phone with a forced smile | 박부장 [53, 40], 아내 (off-screen, phone) [70, 77] |

- How they were made (PixelLab): Pro Flash `create_image_pro_flash` at 192×128 with a background. The style image was the office-wear Park (`story/src/park_office_ref.png`, a Pro Flash edit of `park/park_ref_front.png`); for `prologue_4` and `prologue_5` it was Park next to frame 0 of `monsters/gangsi_sangmu_idle.png`, reduced to 12 colours so it stays small enough to send. The paper slime and stapler bat were described in the prompt.
- Cleanup as for the other panels (colours merged, 0–41 faint specks per panel). Nothing was redrawn. Raw picks: `story/src/prologue_N_raw_*.png`; `alt_prologue_4a.png` is the rejected first `prologue_4` (better stapler bat and 강시, but the slime is cut off by the left edge).
- Credits: **48 generations** (8 Pro Flash panels, 6 each; `prologue_4` was generated twice).
- Known issues: in `prologue_4` the stapler bat and the 강시 are simplified compared with their game sprites. In `prologue_6` Park has tears on his cheeks, which reads as more upset than bewildered. The emblem at the top of the tower in `prologue_3` is cut by the top edge.
- The earlier prologue ("명예로운 퇴직") is kept in `story/src/old_prologue/`, with its raw picks, alternates and the two inpaint fixes (monitor notes removed in panel 1, briefcase in panel 5).

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
- Fix after review: the wall clock in `ep0_3` had no hands. One Pro Flash inpaint (40×40 crop, a disc of radius 11.5 inside the tick marks) added hands at 5:00: a short hour hand to 5, a long minute hand to 12, a thin red second hand. Only 65 pixels inside the clock face changed. The original is `story/src/ep0_3_v1.png`, the inpaint output `story/src/ep0_3_fix_clock_inpaint.png` (5 generations).
- Known issues: `ep0_3` shows only Park's arm, not his face. In `ep0_4` the stapler bat and the clip rat come from the prompt only, so they look a little different from their game sprites.

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

### Episodes 6 and 7 (`ep6_*`, `ep7_*`)

- "6화 — 3일 차 신입 (1100층)" and "7화 — 올해의 영업왕 (2000층, 공로패)", 4 panels each, same format as the prologue. `story/_sheet_ep6.png` and `_sheet_ep7.png` show them ×2 in one row (like `_sheet_ep2.png`). Characters were placed with empty space above their heads for the game's speech bubbles.

  | File | Panel |
  |---|---|
  | `ep6_1` | Floor 1100 break room (coffee machine, water cooler, vending machine, purple glow, a wall torch): 오사원 at a round table, cheek on his hand, writes on a sheet with a black pen; a paper cup and his phone beside him |
  | `ep6_2` | Park stands in teacher mode, frowning, holding the sheet covered in red wavy correction lines and a red tick, the red pen at his chest; 오사원 sits at the table and looks up blankly |
  | `ep6_3` | Both seated at the table: 오사원 with starry eyes, a blush and clasped hands, sparkles around him; Park holds the red-marked sheet with a puzzled face and a sweat drop |
  | `ep6_4` | 오사원 stands and tucks the folded red-marked sheet away, phone in his other hand; Park behind the table, arms crossed, eyes closed, nodding with a satisfied smile |
  | `ep7_1` | Floor 2000 sales boss room (bar-chart posters, a row of framed trophy plaques, torches, toppled desks): the defeated boss, a translucent pale-blue ghost of a man in a suit with spiral eyes, lies on the floor fading into wisps beside a dropped megaphone; Park stands to the left, sweating, pen in hand |
  | `ep7_2` | A wood wall of dull plaques with blank gold plates; one gleams with sparkles and shows a photo of a young Park (full black hair, moustache, navy suit); Park in the foreground points at it, eyes bulging, mouth open |
  | `ep7_3` | 박주임 bends forward toward the gleaming plaque with starry eyes and a big grin; Park beside him, eyes closed, holds up a flat palm to say no |
  | `ep7_4` | Chest-up Park holds the plaque turned over: on the plain brown back, a small round white sticker with the red horned-circle emblem from `prologue_6`; he squints at it, one brow raised |

- New character reference (64×64, transparent, binary alpha, in `story/src/`): `ref_oh_sawon.png`, 막내 오사원: two-block haircut, white wireless earbuds, oversized beige cardigan over a white T-shirt, slim blue lanyard, sleepy deadpan face, a black phone in one hand. Pro Flash with `park_office_ref.png` as the style image (proportions, outline and shading only), rolled twice; the cleaner roll had no visible earbuds, so one Pro Flash text edit added the earbuds and lanyard and made the sides of the hair shorter (a second edit with another seed was not used).
- Style images: `ep6_1` used the 오사원 reference alone; `ep6_2`–`ep6_4` used Park + 오사원 side by side (128×64, labelled "left: Park, right: 오사원"); `ep7_3` used Park + 박주임 (`ref_park_jumim.png`); `ep7_1`, `ep7_2` and `ep7_4` used Park's reference alone. The ep7 boss has no reference: it is a generic ghostly sales manager drawn from the prompt. The emblem in `ep7_4` was described in the prompt (a red ring with two short horns on top). Prompts repeat the same description of Park.
- `ep6_2` was fixed with a Pro Flash text edit of the whole panel: the first roll's red marks looked like an O, an X and a 9; the edit turned them into wavy correction lines and a tick. A Pro Flash inpaint over the sheet was tried first and came back unchanged.
- Cleanup as for the prologue (colours merged at RGB distance ≤ 6, 0–35 faint specks per panel; 27–89 colours per panel). Six panels came back with a light bottom row (the grid-recovery artefact; in `ep6_2` it had letter-like grey dashes), and some had an off-colour first or last column (`ep6_1`, `ep6_2`, `ep7_1`, `ep7_3`, `ep7_4`); each was replaced by a copy of the row or column next to it. Nothing was redrawn.
- Raw picks: `story/src/{ep6,ep7}_N_raw_*.png` (and `ep6_2_edit_e62e.png`, the edited `ep6_2` before cleanup). Unused alternates: `alt_ep6_3a` (a thought bubble with a clock and a sunset door filled the space above 오사원's head, and a grey question mark floated by Park) and `alt_ep7_4a` (stronger close-up, but Park's head touches the top edge, leaving no room for his line). Other rejected rolls were not kept: an `ep6_1` where the earbuds did not show (also its edited version), an `ep6_2` re-roll with smaller, flatter figures, and an `ep7_2` where Park was cut off at the bottom-left corner.
- Credits: **116 generations**: 오사원 reference 20 (2 Pro Flash 64×64 creates and 2 edits, 5 each); 13 Pro Flash panels at 192×128 (6 each; `ep6_1`, `ep6_2`, `ep6_3`, `ep7_2` and `ep7_4` were rolled twice); 2 Pro Flash edits at 192×128 (6 each) and 1 Pro Flash inpaint (6, provisional).
- Fixes after review (Pro Flash inpaint on a crop, output "New layer with changes", masked pixels only; every other pixel is unchanged). The originals are `story/src/ep6_3_v1.png` and `ep7_3_v1.png`; the inpaint layers are `story/src/ep6_3_fix_inpaint.png` and `ep7_3_fix_inpaint.png`.
  - `ep6_3`: a blue-white sweat mark sat on top of Park's bald head. A 5×11 mask on a 32×32 crop painted it as plain scalp. 44 pixels changed.
  - `ep7_3`: the plaque did not match `ep7_2` (an all-gold frame and a different photo). A 36×44 mask on a 64×64 crop redrew it with `ep7_2`'s plaque placed beside the crop as the context image: the same dark wooden plaque, thin gold frame, grey-blue photo of young Park and blank gold plate, smaller. 1,437 pixels changed.
  - Credits: 20 generations (4 inpaints, 5 each). Two of them used the output "Modify current layer", which came back unchanged, so they were run again.
- Known issues: in `ep7_1` Park stands beside the ghost rather than over it, and looks tired rather than triumphant. The young Park photo on the plaque is small in `ep7_3` (about 12 px across). `ep6_2` has only 28 colours after the edit, so it looks a little flatter than the other panels. In `ep6_4` the folded sheet is held at the pocket rather than shown inside it. `ep7_4` is a larger close-up of Park, like `ep5_4`, so it looks coarser.

### Episodes 10 and 11 (`ep10_*`, `ep11_*`)

- "10화 — 동기 (4500층)" (4 panels) and "11화 — 구독자 100만 (5000층, 넥타이핀)" (3 panels), same format as the prologue. `story/_sheet_ep10.png` and `_sheet_ep11.png` show them ×2 in one row (like `_sheet_ep6.png`). Characters were placed with empty space above their heads for the game's speech bubbles.

  | File | Panel |
  |---|---|
  | `ep10_1` | Floor 4500 boss room (a meeting room turned dungeon: long table pushed aside, office chairs, torches, purple glow): 홍과장, red-faced in a faint red aura, points and shouts at Park; Park flinches with a sweat drop, a hand on his tie |
  | `ep10_2` | Flashback in warm sepia: a pocha tent with a hanging bulb, a grill and green bottles with no labels; young Park (black hair, navy suit) and young 홍과장 clink soju glasses, both laughing |
  | `ep10_3` | The same room, dimmer: 홍과장 hangs his head, sad, his red aura fading; Park stands beside him with a serious face |
  | `ep10_4` | Park, smiling, puts his hand on 홍과장's shoulder; 홍과장 grins with a raised fist |
  | `ep11_1` | 공주임 screams with joy (eyes shut, tears, one knee up) and holds out her phone: on the screen a gold plaque with a red play-button shape, golden rays and confetti bursting out; no numbers or letters |
  | `ep11_2` | A PR staffer in a navy suit bows deeply and offers an open box with a gleaming gold tie pin; Park leans back, awkward, with a sweat drop |
  | `ep11_3` | Waist-up: Park, blushing and shyly proud, points his thumb at the gold bar pin gleaming on his red tie; 공주임 beams beside him with big gold sparkles and green up arrows around her |

- New character reference (64×64, transparent, binary alpha, in `story/src/`): `ref_hong_gwajang.png`, 홍과장: red flushed face, short spiky grey-and-black hair, angry brows, open shouting mouth, rumpled grey suit, white shirt and red tie. Pro Flash with `park_office_ref.png` as the style image (proportions, outline and shading only), one roll. The PR staffer has no reference; he is drawn from the prompt.
- Style images: `ep10_1`, `ep10_3` and `ep10_4` used Park + 홍과장 side by side (128×64, labelled "left: Park, right: 홍과장"); `ep10_2` used `ref_park_young.png` + 홍과장 (the prompt asked for him younger with black hair); `ep11_1` used the 공주임 reference alone, `ep11_2` Park's alone, and `ep11_3` Park + 공주임. The style images were reduced to at most 48 colours (palette PNG) so they stay small enough to send. Prompts repeat the same description of Park.
- Cleanup as for episodes 6 and 7 (colours merged at RGB distance ≤ 6, 8–41 faint specks per panel; 31–71 colours per panel). Four panels came back with a light bottom row (the grid-recovery artefact) and `ep10_1` with off-colour first and last columns; each was replaced by a copy of the row or column next to it. Nothing was redrawn.
- Raw picks: `story/src/{ep10,ep11}_N_raw_*.png`. Unused alternate: `alt_ep11_3a` (full-body wide shot; Park and 공주임 were small and the tie pin was only a gold speck).
- Credits: **53 generations**: 홍과장 reference 5; 8 Pro Flash panels at 192×128 (6 each; `ep11_3` was rolled twice).
- Fix after review (by hand, no generation): `ep10_1` came back with brown side hair, brown trousers and a small blue sweat drop on the side of Park's head. Inside boxes around his side hair and trousers, the brown shades were remapped one to one onto the black and dark greys of `park_office_ref.png`, and the drop's 12 pixels were painted as hair. 175 pixels changed; every other pixel is unchanged. The original is `story/src/ep10_1_v1.png`.
- Known issues: in `ep10_2` the sepia tint makes young 홍과장's hair look brown. `ep11_3` is a larger close-up, so it looks coarser (like `ep5_4`), and its background is blurrier than the other panels; a few sparkles sit in the space above the heads where the bubbles go.

### Episodes 8 and 9 (`ep8_*`, `ep9_*`)

- "8화 — 늦지 마 (3000층)" and "9화 — 박부장들 (4000층)", 4 panels each, same format as the prologue. `story/_sheet_ep8.png` and `_sheet_ep9.png` show them ×2 in one row. Speakers have empty space above their heads for the speech bubbles.

  | File | Panel |
  |---|---|
  | `ep8_1` | Floor 3000 finance vault: the round vault door swung open, shelves of gold bars, coins and cash; an old watch with a brown strap glows on a red cushion on a pedestal; small Park from behind at the lower left, startled |
  | `ep8_2` | Close-up: Park's hands (white cuffs) hold the watch turned over; the steel case back is blank, with only a shine and a few scratches |
  | `ep8_3` | Flashback in warm sepia: an apartment entrance in the morning; young Park (black hair, navy suit) holds out his wrist while his wife in a cream cardigan and yellow apron fastens the watch, smiling |
  | `ep8_4` | Back in the vault: Park, teary and moved, fastens the watch on his wrist; in his other hand a phone whose screen shows three red marks for missed calls |
  | `ep9_1` | Floor 4000 dungeon office: Park, alarmed, pen in hand, surrounded by paper slimes and stapler bats; blank business cards fall by his feet |
  | `ep9_2` | In a golden swirl of blank glowing cards, four past Parks stand in a row, hair thinning left to right (full black hair and navy suit; full hair, saluting with a grin; comb-over with a bald crown; bald top with a few strands); the present Park in the lower right corner, jaw dropped |
  | `ep9_3` | Five Parks charge together swinging giant ballpoint pens at slimes and stapler bats, impact stars and flying paper; the present Park in the front center |
  | `ep9_4` | After the fight, smoke puffs and scattered papers: Park sits on a crate, hand on his bald head, gazing wistfully at the card on top of the bundle, which shows a tiny portrait |

- New references (64×64, transparent, binary alpha, in `story/src/`):
  - `ref_park_young.png`: Park on his first day at work, the same face and moustache with full black hair and a navy suit. Pro Flash text edit of `park_office_ref.png`.
  - `ref_wife_young.png`: Park's wife in the flashback, late 20s, shoulder-length brown hair, cream cardigan, pale yellow apron. Pro Flash with `park_office_ref.png` as the style image, rolled twice; the second roll was kept.
- Style images: Park's reference alone for `ep8_1`, `ep8_2` and `ep8_4`; young Park + wife (128×64) for `ep8_3`; Park + young Park (128×64, reduced to 20 colours so it stays small enough to send) for all of episode 9. The monsters (paper slime, stapler bat) and the middle ages of Park were described in the prompt.
- Cleanup as before (colours merged at RGB distance ≤ 6, 4–42 faint specks per panel; 32–87 colours per panel). Seven panels had the light bottom-row artefact and some an off-colour edge column; each was replaced by a copy of the row or column next to it. Nothing was redrawn.
- Raw picks: `story/src/{ep8,ep9}_N_raw_*.png`. Unused alternate: `alt_ep9_2a` (the glowing cards had letter-like marks, and the second Park had full hair like the first).
- Credits: **69 generations**: 3 references (5 each) and 9 Pro Flash panels at 192×128 (6 each; `ep9_2` was rolled twice). Four calls failed before generating because the style image was cut off in transit, so they cost nothing.
- Fixes after review (Pro Flash inpaint, output "New layer with changes", masked pixels only; every other pixel is unchanged). The originals are `story/src/ep8_3_v1.png`, `ep8_4_v1.png` and `ep9_2_v1.png`; the inpaint layers are `story/src/*_fix_inpaint*.png`.
  - `ep8_3`: the watch on young Park's wrist was a tangle of hands and strap. A 26×26 mask on a 48×48 crop redrew it as a round white watch face on a brown strap, with the wife's fingers at the buckle. 440 pixels changed.
  - `ep8_4`: Park's arms did not read as a forearm wearing a watch, and the phone showed three red squiggles. The arm area (46×24 mask, inpainted on the raw panel) became a forearm across his belly with a round steel watch, his other hand's fingertips on it. The phone screen (9×20 mask on a 32×32 crop) now shows one small red missed-call mark. 780 pixels changed.
  - `ep9_2`: the third past Park had a mouth-like outlined shape on top of his head. Two tries redrew the same shape; the third, a 12×8 mask asking for plain scalp, removed the dark outline and left faint thin strands, like a comb-over. 64 pixels changed.
  - Credits: 34 generations (2 inpaints on 48×48 and 32×32 crops, 5 each; 4 on the full panel, 6 each: the `ep8_4` arm and three `ep9_2` tries, of which only the last was used). Two more calls failed before generating because the crop was cut off in transit, so they cost nothing.
- Known issues: the hair of the second past Park in `ep9_2` is full, with only a slightly higher hairline. The portrait on the card in `ep9_4` is tiny (about 6 px), so the full hair barely reads. The missed-call mark on the phone in `ep8_4` is about 5 px, so it reads as a small red arrow rather than a phone. In `ep8_1` the binder spines on the shelf have small blank labels. `ep8_1` shows Park small and from behind.

### Episodes 12, 13 and 14 (`ep12_*`, `ep13_*`, `ep14_*`)

- "12화 — 정규직 (6000층)" (4 panels), "13화 — 비서실장 (6500층)" (3 panels) and "14화 — 들켰다 (7000층)" (4 panels), same format as the prologue. `story/_sheet_ep12.png`, `_sheet_ep13.png` and `_sheet_ep14.png` show them ×2 in one row (like `_sheet_ep6.png`). Speakers have empty space above their heads for the speech bubbles, except `ep13_3` and `ep14_2` (see known issues).

  | File | Panel | Speaker head points [x, y] |
  |---|---|---|
  | `ep12_1` | The HR floor turned dungeon (grey filing cabinets, stacks of folders, purple torches): a giant wooden approval stamp with a red handle glows gold on a white marble pedestal; small Park and 김인턴 from behind at the lower left | (none) |
  | `ep12_2` | 김인턴, hands clasped, gazes up with wet hopeful eyes; the base of the stamp on its pedestal glows at the right edge | (none) |
  | `ep12_3` | Park slams the giant stamp onto a blank sheet on a desk (impact lines, dust, a plain red mark); 김인턴 at the left of the desk, startled | 김인턴 [40, 31], 박부장 [112, 26] |
  | `ep12_4` | 김인턴 kneels and bawls, hugging the blank sheet with its red mark; Park beside him, crying too, pats his back; 오사원 behind at the right with a white envelope at his cardigan; the stamp lies on the floor at the right | (caption only) |
  | `ep13_1` | Floor 6500 finance hall (dark marble, gold-trimmed pillars, a round vault door, purple torches): rose petals rain through a pink shaft of light; the chief of staff stands in the middle with a rose at his face | 실장 [107, 58] |
  | `ep13_2` | The same hall: Park raises his pen like a sword, 최대리 holds up her blue folder like a shield, 김인턴 sweats behind them, all facing right; rose petals drift in from the right | 최대리 [68, 44] |
  | `ep13_3` | Chest-up, the chief of staff holds out an old photo: young Park (black hair, moustache, navy suit, red tie) beside a grey-haired senior in a grey suit whose face is under the chief's thumb | 실장 [120, 13] flip |
  | `ep14_1` | Floor 7000 IT boss room (server racks, cables, blank cyan monitors, purple torches): Park in a battle stance, pen up, startled as the phone in his hand buzzes with a pink heart icon; the cyborg IT executive (`legacy_sangmu`) crouches at the right | (none) |
  | `ep14_2` | The apartment living room at night: the wife (about 50, reading glasses) on the sofa holds up her phone, cold stare; the screen shows a small video thumbnail of Park in fantasy armour and a red cape with a giant pen | 아내 [48, 14] |
  | `ep14_3` | Back in the boss room: Park, phone at his ear, frozen with bulging eyes and sweat; the boss stops mid-swing, cable arm raised, glancing at him | 박부장 [56, 52] |
  | `ep14_4` | Darkness with a faint blue light from above: waist-up Park stares at the black phone in his hands, gloom lines on his forehead, eyes blank | 아내 (off-screen, phone) [48, 20] |

- New character references (64×64, transparent, binary alpha, in `story/src/`):
  - `ref_minam.png`: 꽃미남 실장, about 30, glossy jet-black hair swept back to one side, clean handsome face, slim charcoal suit, white shirt, dark tie, a red rose in a black-gloved hand. Pro Flash with `park_office_ref.png` as the style image (proportions, outline and shading only), rolled twice; the first roll had messy hair and smudged eyes.
  - `ref_wife.png`: the wife today, about 50: the same shoulder-length brown bob as `ref_wife_young.png` with grey streaks, thin dark reading glasses, cream cardigan and long brown skirt (no apron). Two Pro Flash text edits of `ref_wife_young.png` (one with clear glasses, one with grey hair but only half the glasses), then a third edit of the first to add the grey streaks.
  - The ep14 boss has no new reference: the panels used frame 0 of `monsters/legacy_sangmu_idle.png` (floor 7000 is a 개발팀 floor, whose executive is `legacy_sangmu`).
- Style images (palette PNGs, at most 48 colours, each reference cropped to its bounding box and placed side by side, bottom-aligned, 4 px apart): Park + 김인턴 for `ep12_1` and `ep12_3`; 김인턴 alone for `ep12_2`; Park + 김인턴 + 오사원 for `ep12_4`; `ref_minam.png` alone for `ep13_1`; Park + 최대리 + 김인턴 for `ep13_2`; 실장 + `ref_park_young.png` for `ep13_3`; Park + boss for `ep14_1` and `ep14_3`; `ref_wife.png` + Park for `ep14_2`; Park alone for `ep14_4`. Prompts repeat the same description of Park.
- Fix by hand on `ep12_4` (no generation): the face of the stamp on the floor had a carved seal-like pattern, and the sheet in 김인턴's arms had grey text lines and a small dark loop like a letter. The dark-red pattern inside the stamp face (63 px) was painted the face's own red, and the lines and loop (50 px) the sheet's white. 113 pixels changed; the original is `story/src/ep12_4_raw_e124a.png`.
- Cleanup as before (colours merged at RGB distance ≤ 6, 11–52 faint specks per panel; 40–72 colours per panel). Six panels had the light bottom-row artefact, and `ep12_4`, `ep13_2` and `ep13_3` an off-colour last column, `ep14_1` an off-colour first column; each was replaced by a copy of the row or column next to it.
- Raw picks: `story/src/{ep12,ep13,ep14}_N_raw_*.png`. Unused alternates: `alt_ep12_3a.png` (a stronger slam, but both heads touch the top edge), `alt_ep13_1a.png` (the chief larger and closer, his head near the top edge), `alt_ep14_2a.png` (a point-of-view close-up of the phone in the wife's hands, with a larger, clearer thumbnail of Park in armour, but the wife herself is not shown). Other rejected rolls were not kept: two `ep13_2` rolls that drew only the hall, and one with only the chief; an `ep12_4` where 김인턴's sheet had no red mark; an `ep13_3` with the chief's head at the top edge; an `ep14_3` where Park lost his moustache; and an `ep14_4` with a small, unreadable Park.
- Credits: **151 generations**: references 25 (2 Pro Flash 64×64 creates and 3 Pro Flash edits, 5 each); 21 Pro Flash panels at 192×128 (6 each; `ep12_3`, `ep12_4`, `ep13_1`, `ep13_3`, `ep14_2`, `ep14_3` and `ep14_4` were rolled twice and `ep13_2` four times).
- Known issues: `ep13_3` is a large close-up, so it looks less chibi (like `ep7_4`), and the chief's head is near the top edge, so the bubble has to grow to the left. In `ep14_2` the wife's head is near the top edge, the grey streaks of her reference barely show, and the thumbnail of Park in armour is small (about 14 px across). In `ep12_1` Park is small and seen from behind. In `ep14_3` Park's face is not pale. The mug in `ep14_2` has a small leaf-like mark (no letters).

### Cookie and the wardrobe special (`cookie_*`, `wardrobe_*`)

- "쿠키 — 10000층 이후" (2 panels) and "특별편 — 옷장" (3 panels), same format as the prologue. `story/_sheet_cookie.png` and `_sheet_wardrobe.png` show them ×2 in one row (like `_sheet_ep6.png`). Speakers have empty space above their heads for the speech bubbles.

  | File | Panel | Speaker head points [x, y] |
  |---|---|---|
  | `cookie_1` | Chairman's office in the morning (big window on a golden city skyline, dark wood, wall sconce, green desk lamp): the chief of staff (13화 flower boy, red rose at his lapel) bursts through the door at the left, shouting, sweat drops flying, one hand thrust out; Park sits behind the desk in a leather chair with a coffee cup, startled | 실장 [36, 34] |
  | `cookie_2` | The same office: waist-up Park in front of the window straightens the knot of his red tie with both hands, calm and heavy-lidded | 박부장 [89, 30] |
  | `wardrobe_1` | A home dressing room full of hero costumes on mannequins (bronze with red plume, horned dark iron, green ranger hood, silver with white cape, gold crown-helm), more on the shelves; Park in shirt and tie with the set 6 royal red cape (gold trim, ermine collar) poses with a fist on his hip in front of a tall mirror that shows his reflection | 박부장 [110, 40] |
  | `wardrobe_2` | The same room: Park in the cape at the left, fully in frame, sweating and teary with a guilty smile; the wife (`ref_wife.png`: brown bob with grey streaks, thin reading glasses, cream cardigan, brown skirt) stands by the door, hand on hip, holding up a tall bundle of blank white receipts | 아내 [140, 35] flip |
  | `wardrobe_3` | Park, cape billowing, leaps over the sill of the open window toward a sunny sky over apartment blocks, looking back with a panicked face; the wife runs after him at the left with the receipt bundle, blank slips flying | 박부장 [128, 18] flip |

- Character references: the panels use the shared refs `story/src/ref_minam.png` (the chief of staff, from 13화) and `story/src/ref_wife.png` (the wife at about 50, from episode 14), so they look the same in every episode. Two refs made earlier for this batch (a chief of staff with a tablet, a wife without glasses) were superseded and deleted.
- Style images (palette PNGs, at most 40 colours so they stay small enough to send): `cookie_2` used Park's reference alone; `cookie_1` used Park + `ref_minam.png`. `wardrobe_1` used one row of Park's reference, Park's idle frame 0 wearing only the set 6 cape (`parts/suits/strips/s6_cape_idle.png`), and Park dressed in full sets 2, 3, 5 and 6 (idle frame 0 of each `strips/s{n}_*_idle.png`), each cropped to its bounding box. `wardrobe_2` and `wardrobe_3` used Park's reference, Park in the set 6 cape and `ref_wife.png`. The green ranger set (set 4) and the remaining costumes were described in the prompt. Prompts repeat the same description of Park. Park wears the cape over his shirt and tie, without the crown-helm, so his bald head still reads.
- Cleanup as before (colours merged at RGB distance ≤ 6, 4–53 faint specks per panel; 63–79 colours per panel). Four panels had the light bottom-row artefact; `wardrobe_2` also had an off-colour first row and first column, and `wardrobe_3` an off-colour first row. Each was replaced by a copy of the row or column next to it.
- Hand fix (no generation): the padlock on the chest in `wardrobe_2` looked like the digit 8. Its 3×5 pixels were repainted as a plain gold plate with a two-pixel keyhole slot (15 pixels changed). The version before the fix is `story/src/wardrobe_2_v1.png`.
- Raw picks: `story/src/{cookie,wardrobe}_N_raw_*.png`. Unused alternates, from before the switch to the shared refs: `alt_cookie_1a.png` (the earlier 실장 with a navy tie and tablet), `alt_wardrobe_2a.png` (the wife looked about 30), `alt_wardrobe_2b.png` (Park cut by the left edge) and `alt_wardrobe_3a.png` (the earlier wife without glasses).
- Credits: **64 generations**: 2 references, now superseded (5 each), and 9 Pro Flash panels at 192×128 (6 each). `wardrobe_2` was rolled three times, and `cookie_1` and `wardrobe_3` twice each. One call was rejected before generating because the style image was cut off in transit, so it cost nothing.
- Known issues: in `wardrobe_2` the receipts read as a tall rolled bundle rather than a loose stack, and Park looks teary rather than just sweating. In `wardrobe_3` Park is going over the sill rather than already outside, and he has a grey sweat streak on the side of his head. Park's reflection in the mirror in `wardrobe_1` shows no cape. In `cookie_2` Park looks calm and sleepy rather than fiercely determined. In `cookie_1` the chief of staff is smaller than Park and is drawn with a smaller head than in `ref_minam.png`.

### Episodes 15, 16 and the finale (`ep15_*`, `ep16_*`, `final_*`)

- "15화 — 택배 (8000층)" (4 panels), "16화 — 에어컨 고장 (9000층)" (3 panels) and "최종화 — 회장실 (10000층)" (8 panels), same format as the prologue. `story/_sheet_ep15.png` and `_sheet_ep16.png` show them ×2 in one row; `_sheet_final.png` shows the finale ×2 in rows of three (like `_sheet_ep5.png`). Speakers have empty space above their heads for the speech bubbles.

  | File | Panel | Speaker head points [x, y] |
  |---|---|---|
  | `ep15_1` | Floor 8000 dungeon corridor (stone walls, purple glow, torches, file boxes): Park slumped, a hand on his aching back, sweat drop; a taped cardboard parcel has just landed in front of him with motion lines and a sparkle | (none) |
  | `ep15_2` | Top-down into the opened parcel, Park's hands holding the flaps: a plain white patch box with a blue stripe, a lunchbox knotted in pink cloth, a cream envelope with a red heart seal | (none) |
  | `ep15_3` | Close-up of the handwritten letter held in two hands: rows of grey scribble lines only (the game shows the letter text), a red heart at the bottom, two tear spots | (letter text over the page) |
  | `ep15_4` | Park, shirt untucked, presses a patch onto his lower back; behind a stone pillar at the right 오사원 wipes his eyes with his sleeve, 김인턴 and 공주임 sniffling behind him; the opened parcel on the floor | 오사원 [134, 38] flip |
  | `ep16_1` | Floor 9000, a corridor walled with air-conditioner outdoor units, orange heat haze and steam: 홍과장, red-faced and soaked, shouts and points at the ceiling; Park wilts beside him, eyes shut, sweating | 홍과장 [115, 52] |
  | `ep16_2` | The defeated outdoor-unit boss (cracked, smoking, spiral eyes) slumps at the right; a giant round 태극 hand fan with a gold rim and wooden handle floats down, glowing; Park at the left looks up, sweating | (none) |
  | `ep16_3` | Park, laughing, swings the giant fan; blue wind lines blow over 홍과장, 오사원, 공주임 and 김인턴, who sit on the floor with their eyes closed, relieved | 박부장 [25, 51] |
  | `final_1` | The vast chairman's office at night (city lights through tall windows, a long red carpet): Park in the left foreground, fists clenched; far away behind the desk the high-backed red chair with its back to him | 박부장 [33, 40] |
  | `final_2` | The same room: behind the big desk the high-backed red chair has just swivelled round (motion arcs), and the chairman (white hair, small red horns, charcoal suit, red tie) looks across the desk; Park stands on the near side at the left, recoiling, sweat drops | 박부장 [28, 48], 회장 [122, 28] |
  | `final_3` | Flashback in sepia: on the tower roof above the clouds the younger 왕대리 (grey hair, no horns, rumpled suit, briefcase at his feet) raises a giant pen; the crowned, horned demon king lies defeated behind him | 회장 (voice-over) [60, 12] |
  | `final_4` | The chairman behind his desk turns an old laptop toward the viewer: the screen shows the job-ad layout of `prologue_2` (grey bars, the red horned ball emblem with four sparkles), no text | 회장 [103, 23] |
  | `final_5` | The last duel, seen over the chairman's shoulder: the chairman's back in the right foreground, white hair and glowing red horns in a red aura; facing him in the centre Park in a battle stance with his pen, his bald head blazing white at the same moment; behind Park all seven teammates in one row, left to right 김인턴, 박주임, 최대리, 공주임, 오사원, 홍과장, 실장 with a rose | 회장 [160, 31] flip |
  | `final_6` | The same room after the duel, papers and smoke on the floor: Park perches stiffly in the high-backed red chair behind the desk, leaning forward with both hands on the desk edge, awkward and worried; in front of the desk the chairman sits slumped on the floor, exhausted, not smiling | 박부장 [72, 38] |
  | `final_7` | Waist-up Park at the big desk slams a wooden stamp onto a document on a dark approval board (a plain red ring, no letters), impact lines, papers flying; sunset city behind | 박부장 [90, 25] |
  | `final_8` | A warm apartment dinner table at dusk (pendant lamp, stew, side dishes): Park, laughing, his bald head shining; the teenage daughter (ponytail, grey hoodie) in the middle; the wife as in `ref_wife.png` (brown bob, thin reading glasses, cream cardigan) at the right; in the lower left a white business card with a gold edge and a small red horned emblem | 아내 [148, 37] flip, 박부장 [33, 38] |

- New character reference (64×64, transparent, binary alpha, in `story/src/`): `ref_chairman.png`, the chairman (formerly 왕대리): neat white hair combed back, white brows, wrinkled face with a knowing half-smile, two small curved dark red horns, charcoal three-piece suit, white shirt, red tie, hands behind his back. Pro Flash with `park_office_ref.png` as the style image (proportions, outline and shading only), one roll.
- Style images (palette PNGs, 14–24 colours so they stay small enough to send): Park's reference alone for `ep15_1`–`ep15_3`, `ep16_2`, `final_1` and `final_7`; Park + 오사원 for `ep15_4`; Park + 홍과장 for `ep16_1` and `ep16_3`; Park + chairman for `final_2` and `final_6`; the chairman alone for `final_3` (asked younger, without horns) and `final_4`; Park + `ref_wife.png` for `final_8`. For `final_5`, a one-row lineup of all nine at half size (Park, chairman, 김인턴, 박주임, 최대리, 공주임, 오사원, 홍과장 and `ref_minam.png`, 160×28, 16 colours). The other teammates in `ep15_4` and `ep16_3` were described in the prompt. Prompts repeat the same description of Park.
- Fixes (masked pixels only unless noted; originals are the `*_raw_*` files):
  - `final_2`: both rolls left the chairman's horns out against the red chair. A Pro Flash text edit of the whole second roll added them (`src/final_2_edit_r2e.png`; the edit also flattened the panel to 24 colours).
  - `final_4`: the emblem on the laptop was a lumpy heart shape. A 16×16 inpaint redrew it as the red ball with two horns. 150 pixels changed (`src/final_4_fix_inpaint.png`).
  - `final_8` (by hand): the emblem on the card was a muddy red-brown blob. A 6×5 red ball with two 1-px horns was drawn on the card's cream colour and the card's top edge made gold above it (41 pixels).
  - `final_1` (by hand): a stray red-orange ball on the floor near Park's feet was painted over with the floor 10 px to its left (94 pixels changed).
- Cleanup as before (colours merged at RGB distance ≤ 6, 5–62 faint specks per panel; 28–93 colours per panel). Eleven panels had an off-colour bottom row (the grid-recovery artefact) and `ep16_1` and `final_4` off-colour first and last columns; each was replaced by a copy of the row or column next to it.
- Raw picks: `story/src/{ep15,ep16,final}_N_raw_*.png`. Unused alternates: `alt_final_5a.png` (Park and the chairman face off from the side with all seven teammates in a tight block behind Park, but everyone is small and the teammates look alike) and `alt_final_6b.png` (Park perched on the red chair beside the end of the desk rather than behind it). Other rejected rolls were not kept: a `final_1` where Park's face was hidden in profile, a `final_2` with Park cut in half by the left edge, and a `final_6` where Park sat on the desk with his legs hanging in front of it.
- Redraw after review: `final_2`, `final_5`, `final_6` and `final_8` were drawn again (chair behind the desk in `final_2`; a fresh `final_5` with all seven teammates; a new `final_6` script with Park on the chair and the chairman defeated; the canonical wife from episode 14 in `final_8`). The first versions, their raw picks, inpaint layers and the old alternate are in `story/src/old_final/` (`final_N_v1.png` is each panel as first delivered).
- Credits: first pass **167 generations** (the chairman reference 5; 19 Pro Flash panels at 192×128, 6 each; 7 Pro Flash inpaints and 1 Pro Flash edit at 192×128, 6 each). Redraw **54 generations**: `final_2` 18 (2 rolls and 1 whole-panel edit), `final_5` 12 (2 rolls), `final_6` 18 (3 rolls), `final_8` 6 (1 roll). Pro Flash returns one image per call at 6 generations for this size; no cheaper option with a style image was found. Five calls were rejected before generating because the style image was cut off in transit, so they cost nothing.
- Known issues: in `final_5` the chairman is seen from behind and the teammates are about 12 px tall, so they read by hair and clothes colour; 공주임 wears a white top rather than her pink cardigan. `final_2` is flatter (24 colours) after the edit, and the horns are small. In `final_6` Park is seen only from the chest up, so "perched on the edge" reads through his forward lean and hands on the desk. The teardrops on the letter in `ep15_3` look like grey smudges. In `ep15_1` Park is small. `final_3` turns the young 왕대리's hair white-grey in the sepia. The emblems on the card in `final_8` and on the laptop are about 6 px.

## Story icon (`icons/story.png`)

- 32×32, transparent, binary alpha, no letters: an open comic book with small picture panels on both pages and a red bookmark ribbon, for the 스토리 menu.
- PixelLab Pro Flash 32×32 with `icons/missions.png` as the style image (5 generations, included in the count above). Used as generated.

## Profile icon and the shop "+"

- `icons/side_profile.png` (32x32): Park's face for the side menu's 프로필. PixelLab Pixflux img2img (strength 300, 1 generation) from the head of `park/idle_0.png`; raw in `icons/src/side_profile_raw.png`, alpha cut at 128.
- `ui/plus_button.png` (14x14, drawn 1:1; nearest-neighbour from the 26 px crop): the green "+" at the end of the gem and coupon counters, opening the shop. PixelLab Pixflux 32x32 (1 generation), cropped to its pixels; raw in `ui/src/plus_button_raw.png`.

## Side job icons, profile and application frames

- `icons/job_j00.png` to `job_j24.png` (32x32): one icon per side job (부업), in `SIDE_JOBS` order. PixelLab Pixflux 32x32, one generation each, palette forced to the colours of the existing `icons/` (46 colours); `j03`, `j08` and `j14` were rolled a second time. Raws in `icons/src/job_*_raw.png`, alpha cut at 128. Contact sheet `icons/_sheet_jobs.png`.
- `ui/profile_panel` (44x45), `profile_row` (36x36), `profile_button` (40x20), `profile_button_hot` (48x29): the 프로필 sheet as a leather employee ID card holder (brown leather, stitching, brass rivets; tan rows). PixelLab Pixflux text-to-image, cropped to their pixels; 9-slice insets 12 / 10 / 8 / 8.
- `ui/apply_panel` (44x44), `apply_row` (26x26), `apply_button` (42x26), `apply_button_hot` (48x28): the first-launch 입사지원서 as a cream paper form with a dark red ruled border, a dashed field box and red stamp buttons. Same method and insets 12 / 8 / 8 / 8. Raws for all eight in `ui/src/*_raw.png`; contact sheet `ui/_sheet_profile_apply.png`.
- An img2img pass from the ranking frames (strength 200, then 80) kept too much of the navy ranking look and was dropped (4 generations).

## Button corners cleaned (2026-10-07)

- `ui/button_gold.png`, `button_gold_hot.png` and `button_disabled.png` lost their corner ornaments (gold studs, silver brackets and a white tip pixel) at the user's request: in each corner a 10x10 area was refilled from the edge cross-sections next to it, with the very corner pixel left transparent. The originals are in `ui/src/*_corners_orig.png`.
- `ui/row_panel.png` got the same treatment (its gold corner brackets refilled from the edges, 6x6 per corner, 2026-10-07); original in `ui/src/row_panel_corners_orig.png`.
- `ui/icon_box.png`: its corner glints (white top corners, gold bottom-right) recoloured to the black rim (23 px, 2026-10-07); original in `ui/src/icon_box_corners_orig.png`.

## Fever flame (Codex)

- `fx/fever_flame.png` (6 frames of 43x44, one row): the fire aura streaming back from Park during 피버타임. Made with Codex image generation at the user's request (PixelLab was out of generations): a 2172x724 six-frame strip on magenta (`fx/src/fever_flame_codex.png`), keyed, cropped to the shared bounds, nearest-neighbour scaled to 44 px tall, alpha cut at 128, quantised to 12 colours.
