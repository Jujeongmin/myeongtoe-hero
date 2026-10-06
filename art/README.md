# 명퇴용사 박부장: art assets

Every image is pixel art at its native size. Alpha is binary (0 or 255), there is no anti-aliasing and palettes are limited.
Scale up only by an integer factor with nearest-neighbour.

## Folder map

| Path | Contents |
|---|---|
| `park/idle_0..3.png`, `park/walk_0..5.png`, `park/attack_0..5.png` | Park, the fantasy hero: 2 heads tall, 52, balding on top with side hair, thick moustache, tired droopy eyes, small belly. He wears a plain tunic, belt, trousers and boots, plus a loosened red necktie. Each frame is 64×64, facing east (right). |
| `park/{idle,walk,attack}_strip.png` | The same frames in one horizontal strip per animation (frame *i* at x = 64·i). |
| `park/anchors.json` | Per-frame anchors and timing. |
| `park/park_ref_front.png` | Front-view reference sprite used to build the character (64×64). |
| `park/old/` | The previous office-worker Park (68×68 frames, anchors, candidates, previews). Kept for reference only. |
| `park/preview/` | Composited previews and contact sheets (see Previews). |
| `parts/suits/s{set}_{slot}.png` | 36 costume parts: 6 sets × 6 slots, each on a 64×64 transparent canvas drawn on idle frame 0. |
| `parts/suits/strips/s{set}_{slot}_{anim}.png` | The same parts redrawn for every frame of idle, walk and attack (108 strips). |
| `parts/suits/parts.json` | Slot, anchor, offset, layer, bbox and strip paths of every part. |
| `park/fx/head_shine.png`, `park/fx/head_shine.json` | Animated glint on Park's bald crown (6 frames, 11×11 each). |
| `parts/old_suits/` | The first office-suit parts. They fit only `park/old/` and are kept for reference. |
| `parts/old_suits_v2/` | The previous code-drawn fantasy parts, replaced by the current ones. Kept for reference. |
| `parts/gear/g00..g29.png` | 30 hand-held office items (업무 장비), each at most 24×24, drawn upright. |
| `parts/gear/scaled/` | Pixel-clean, pre-shrunk copies of the bulky items (see `scale`). |
| `parts/gear/gear.json` | Grip point, default angle and scale of each item. |
| `backgrounds/*.png` | 7 department battle backgrounds (부서 배경), 320×96, opaque, tile horizontally. |
| `icons/*.png` | 28 UI icons, 32×32. `icons/_sheet.png` is a labelled contact sheet. |
| `icons/extra/`, `parts/gear/extra/` | Unused extras left over from generation. They can be deleted. |

## Park

- Canvas: 64×64. The lowest pixel row (boot soles) is always y = 56 (`baselineY`), and the body is about 44 px tall.
- Animations:

  | Animation | Frames | Duration per frame | Loops |
  |---|---|---|---|
  | `idle` | 4 | 250 ms | yes |
  | `walk` | 6 | 110 ms | yes |
  | `attack` | 6 | 90 ms | no |

- The attack is an overhead swing: frame 1 is the wind-up (fist raised above the head), frames 2–4 are the forward strike and frame 5 is the recovery.

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
  - Attack: set by hand to make a sword swing: `[-40, -125, 5, 20, 10, -30]` (wind-up behind the head, then slash forward, then recover).
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

No image contains text.

## Previews (`park/preview/`)

- `full_sets_x4.png` (1×: `full_sets.png`): the 6 full sets on idle frame 0, each holding an item.
- `mixed_outfits_x4.png`: bare Park with a pen, and two mixed outfits:
  - hood + gold armour + black cape + bronze gloves + leather boots + coffee mug, holding a keyboard;
  - gold crown-helm + leather jerkin + white cape + dark gauntlets + hiking boots + ID badge, holding a laptop.
- `anim_all_sets_x3.png`: one row per outfit across all 16 frames (idle 4, walk 6, attack 6). The rows are bare Park, sets 1–6, then the two mixed outfits.
- `anim_bare_x4.png`, `anim_s1_x4.png` … `anim_s6_x4.png`, `anim_mixA_x4.png`, `anim_mixB_x4.png`: the same outfits, one sheet each at 4×.
  - `mixA` = helmet 4, armor 6, cape 3, gloves 2, boots 1, accessory 3, holding a keyboard.
  - `mixB` = helmet 2, armor 5, cape 6, gloves 3, boots 4, accessory 1, holding a laptop.
- `park_strips_x3.png`: bare Park idle/walk/attack, then set 2 holding a pen.
- `head_shine_x4.png`: the glint playing on bare Park's idle loop. `head_shine_strip_x8.png` shows the 6 shine cells.
- `on_backgrounds_x3.png`: Park in a costume standing on each of the 7 backgrounds.
- `parts_sheet.png`: all 36 parts. `gear_sheet.png` and `gear_sheet_scaled.png`: the 30 items at full size and with `scale` applied.

## How it was made

- **Park:**
  - Codex image generation (sprite-gen, provider codex) made a front-view reference. It was reduced to a 64×64 sprite with a kCentroid pixel-art downscaler and a 21-colour palette.
  - PixelLab `create_character` (v3 with that reference) rotated it into 8 directions. The east direction was animated:
    - idle and walk from templates;
    - attack from a custom v3 animation.
  - Slash-trail pixels baked into two attack frames were removed by hand. One frame that was mostly trail was dropped, and the fist in the strike frame was patched from the next frame.
  - The attack frames came out about 11% larger than idle and walk, so they were shrunk with the same pixel-art downscaler to match.
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

- Each set was dressed by AI only on idle frame 0. The other 15 frames are fitted from that drawing, so fine details (straps, rivets) are sharpest at idle and simplified on body parts that move a lot. The forward-reaching arm in attack frames 2–5 is the clearest example.
- Park's hands are tiny in idle and walk, so gloves read mostly in the attack frames.
- The ranger hood (set 4) was drawn together with its cloak. Without the set 4 cape the hood still works, but its shoulder drape is gone.
- In the raised-fist attack frame (attack 1) the fist sits just above the helmet, and the helmet is cut away around it.
- Office items are drawn in a 24 px box. Use `scale` or `scaledFile` to keep bulky ones small.
