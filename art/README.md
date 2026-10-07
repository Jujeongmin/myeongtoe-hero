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
| `parts/suits/strips/s{set}_{slot}_{anim}.png` | The same parts redrawn for every frame of idle, walk and attack (108 strips). **The 36 `_attack` strips still belong to an earlier attack and do not fit the current `park/attack_*` frames** (see Known issues). |
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
| `story/prologue_1..7.png` | The 7 webtoon prologue panels, 192×128, opaque, no text. `story/_sheet_prologue.png` shows them ×2 in reading order; `story/src/` holds the raw picks, unused alternates and the office-Park reference. See Story panels. |

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
- `attack_s2_spritegen_registration_test_x4.png`: the set 2 registration test described in Known issues.
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
- **Office items, backgrounds and icons:** unchanged from the previous delivery, except for the new `scale` data and the scaled copies.

## Generation budget

- **Aura / legend icons, speech bubble, red dot (PixelLab):** **43 generations**: 2 × 64-candidate batches (20 each; 32 px icons, 24 px UI), 2 × Pixen 16×16 red dots and 1 × Pixen edit test that tried to add a glow to the helmet (rejected: it only added noise).
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
- **Costume attack strips are out of date.** `parts/suits/strips/s*_*_attack.png` were fitted to an earlier attack. They do not line up with the current sprite-gen attack, so a worn costume looks wrong during the attack until they are remade.
  - A test dressed set 2 with sprite-gen: the dressed idle-0 was the base and the bare attack row was attached as a motion reference. The poses follow closely, but the dressed figure comes out about 4 px taller and the limbs differ by 1–3 px. After the best shift, 8–30 bare-body pixels per frame still stick out from under the dressed silhouette. A slot split by diff against the bare frame therefore does not register. See `park/preview/attack_s2_spritegen_registration_test_x4.png` (top: bare, bottom: dressed).
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
- **Notification dot** (`red_dot.png`, 10×10, fixed size): a red dot with a `#14110f` outline, darker red lower-right shade and a short white highlight at the upper left (5 colours). It replaces the CSS-drawn red dot; place it on the icon's top-right corner at an integer scale. `applyUiSkin` exposes it as `--ui-red-dot`.
- `_preview_x1.png` / `_preview_x3.png`: a mock list (row panel + icon box + progress bar + the three button states), the HP bar, mission panel, both nav tiles and the menu button.

## Story panels (`story/`)

- Webtoon panels for the prologue in `docs/story/webtoon.md` ("프롤로그 — 명예로운 퇴직"). Each is **192×128** logical pixels, landscape, opaque, with no text, letters or UI (the game overlays the lines). Scale up only by an integer factor with nearest-neighbour.

  | File | Panel |
  |---|---|
  | `prologue_1` | Park at his desk in 총무부: monitor covered in sticky notes, framed certificate, fluorescent glint on his head |
  | `prologue_2` | An HR employee in a vest and glasses hands Park a white envelope; Park laughs naively |
  | `prologue_3` | Night office: an empty desk with one box (plant, mug, pen); Park from behind, slumped |
  | `prologue_4` | Evening street at sunset: Park on the phone, sweating, forcing a smile |
  | `prologue_5` | Park bench by a pond: Park reads the newspaper, his jacket folded beside him, pigeons |
  | `prologue_6` | Close-up: Park's hand holds the turned-over envelope; a small red horned-circle emblem on it matches the one on the newspaper; his eyes narrow |
  | `prologue_7` | A tower piercing the clouds with the red horned emblem on top; tiny Park from behind raises one pen at the entrance, a security guard beside him |

- How they were made (PixelLab):
  1. An office-wear Park reference (`story/src/park_office_ref.png`, 64×64): Pro Flash text edit of `park/park_ref_front.png`, keeping the face, bald head, side hair and moustache and changing the tunic to a white shirt, red tie and dark trousers.
  2. Each panel: Pro Flash `create_image_pro_flash` at 192×128 with a background, using that reference as the style image (labelled as the hero Park), and the same description of Park in every prompt. Prompts asked for a calm band at the top for text.
  3. Cleanup: near-identical colours (RGB distance ≤ 6) merged, and faint lone specks inside flat areas replaced by their surroundings (4 to 32 per panel). Nothing was redrawn. Panels keep 36–86 colours each; they share the reference's outline and skin and shirt colours, but each scene keeps its own lighting (office, night, sunset, day, dusk).
  4. Raw picks are `story/src/prologue_N_raw_*.png`. Unused alternates: `alt_p2a` (plain background), `alt_p6a` (face cropped above the eyes, no bald head), `alt_p7a` (squat tower that does not reach the clouds).
- Credits: **70 generations** (1 × Pro Flash edit at 64×64 = 5, 10 × Pro Flash 192×128 = 6 each, 1 × Pro Flash 32×32 = 5 for the story icon). Panels 2, 6 and 7 were generated twice.
- Known issues: in `prologue_7` the emblem at the top of the tower is cut by the top edge, and the clouds there are busy, so text reads better at the bottom-left or over a dark box. In `prologue_3` Park is seen from behind with more side hair than usual. `prologue_6` is a larger close-up and looks coarser than the other panels.

## Story icon (`icons/story.png`)

- 32×32, transparent, binary alpha, no letters: an open comic book with small picture panels on both pages and a red bookmark ribbon, for the 스토리 menu.
- PixelLab Pro Flash 32×32 with `icons/missions.png` as the style image (5 generations, included in the count above). Used as generated.
