"""Store screenshots dressed for the store page: each phone screen in a gold-rimmed frame over the
game's own office background (darkened), with a headline and two lines of copy in the game's pixel
fonts and the game's name at the bottom. 1280x720 (16:9), each under 1 MB, saved as 1.png, 2.png, ...
usage: python tools/store_shots.py <raw dir> <out dir>
<raw dir> holds the phone screens tools/shots_landscape.mjs takes (1.png … 8.png, 960x1440)."""
import io
import os
import sys

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

W, H = 1280, 720
LIMIT = 1_000_000
GOLD = (255, 209, 102)
INK = (20, 14, 30)
NAME = "명퇴용사 박부장"

# (phone screens by raw number, background, headline, two lines of copy, phones on the left?)
SLIDES = [
    ([1], "bg_sales", "명퇴당한 박부장, 다시 출근!", "볼펜 하나로 마왕그룹 몬스터를 처치\n쉬는 동안에도 자동 전투로 쑥쑥", True),
    ([3], "bg_general_affairs", "업무를 키워 골드 벌기", "복사하기부터 회장님 보고까지\n25가지 업무로 수입 UP", False),
    ([4], "bg_dev", "코스튬으로 박부장 꾸미기", "입기만 해도 능력치 UP\n세트와 오라까지 모아 보자", True),
    ([5], "bg_legal", "층을 오르면 열리는 웹툰", "52세 박부장의\n눈물겨운 재취업 이야기", False),
    ([6, 7], "bg_executive", "연봉협상으로 더 강하게", "응시권으로 자격증을 따고\n피버타임으로 단숨에 질주", True),
    ([8], "bg_parking", "지하주차장 탐사", "30초 동안 얼마나 깊이 갈까?\n20m마다 보물 상자", False),
]


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    # The game's fonts ship as woff2; Pillow reads TrueType, so they are unpacked once.
    ttf = os.path.join(os.environ.get("TEMP", "/tmp"), os.path.basename(path).replace(".woff2", ".ttf"))
    if not os.path.exists(ttf):
        f = TTFont(path)
        f.flavor = None
        f.save(ttf)
    return ImageFont.truetype(ttf, size)


HEAD_FONT = "src/assets/fonts/Mulmaru.woff2"
BODY_FONT = "node_modules/galmuri/dist/Galmuri11.woff2"


def background(name: str) -> Image.Image:
    bg = Image.open(f"art/backgrounds/{name}.png").convert("RGB")
    k = max(W / bg.width, H / bg.height)
    bg = bg.resize((round(bg.width * k), round(bg.height * k)), Image.NEAREST)
    left, top = (bg.width - W) // 2, (bg.height - H) // 2
    bg = bg.crop((left, top, left + W, top + H))
    bg = ImageEnhance.Brightness(bg).enhance(0.3)
    # A soft dark vignette so the frame and the text stand out.
    shade = Image.new("L", (W, H), 0)
    ImageDraw.Draw(shade).ellipse((-W * 0.25, -H * 0.4, W * 1.25, H * 1.4), fill=255)
    shade = shade.filter(ImageFilter.GaussianBlur(120))
    return Image.composite(bg, Image.new("RGB", (W, H), (6, 4, 14)), shade)


def phone(raw: str, n: int, height: int) -> Image.Image:
    shot = Image.open(os.path.join(raw, f"{n}.png")).convert("RGB")
    width = round(shot.width * height / shot.height)
    shot = shot.resize((width, height), Image.LANCZOS)
    rim, r = 6, 26
    framed = Image.new("RGBA", (width + rim * 2, height + rim * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(framed)
    d.rounded_rectangle((0, 0, framed.width - 1, framed.height - 1), radius=r, fill=GOLD + (255,))
    d.rounded_rectangle((2, 2, framed.width - 3, framed.height - 3), radius=r - 2, outline=(140, 96, 30, 255), width=1)
    mask = Image.new("L", shot.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, width - 1, height - 1), radius=r - rim, fill=255)
    framed.paste(shot, (rim, rim), mask)
    return framed


def shadowed(canvas: Image.Image, img: Image.Image, x: int, y: int) -> None:
    sh = Image.new("RGBA", (img.width + 60, img.height + 60), (0, 0, 0, 0))
    sh.paste((0, 0, 0, 170), (30 + 10, 30 + 12, 30 + img.width + 10, 30 + img.height + 12), img.getchannel("A"))
    sh = sh.filter(ImageFilter.GaussianBlur(14))
    canvas.alpha_composite(sh, (x - 30, y - 30))
    canvas.alpha_composite(img, (x, y))


def fit(text: str, path: str, size: int, width: int) -> ImageFont.FreeTypeFont:
    while size > 18:
        f = font(path, size)
        if max(f.getlength(line) for line in text.split("\n")) <= width:
            return f
        size -= 2
    return font(path, size)


def outlined(d: ImageDraw.ImageDraw, xy, text: str, f, fill, stroke: int, anchor: str, spacing: int = 10) -> None:
    d.multiline_text(xy, text, font=f, fill=fill, anchor=anchor, align="center", spacing=spacing,
                     stroke_width=stroke, stroke_fill=INK)


def compose(raw: str, shots: list, bg: str, head: str, copy: str, phones_left: bool) -> Image.Image:
    canvas = background(bg).convert("RGBA")
    height = 640 if len(shots) == 1 else 600
    frames = [phone(raw, n, height) for n in shots]
    gap = 28
    total = sum(f.width for f in frames) + gap * (len(frames) - 1)
    x = 70 if phones_left else W - 70 - total
    y = (H - frames[0].height) // 2 - 6
    for f in frames:
        shadowed(canvas, f, x, y)
        x += f.width + gap
    # The text in the space left beside the phones.
    left = 70 + total + 40 if phones_left else 50
    right = W - 50 if phones_left else W - 70 - total - 40
    cx = (left + right) // 2
    width = right - left
    d = ImageDraw.Draw(canvas)
    if fit(head, HEAD_FONT, 64, width).size < 40 and " " in head:
        # Too long for one line at a good size: two lines, split at the middle space.
        words = head.split(" ")
        mid = min(range(1, len(words)), key=lambda i: abs(len(" ".join(words[:i])) - len(" ".join(words[i:]))))
        head = " ".join(words[:mid]) + "\n" + " ".join(words[mid:])
    hf = fit(head, HEAD_FONT, 64, width)
    bf = fit(copy, BODY_FONT, 30, width)
    outlined(d, (cx, H // 2 - 34), head, hf, GOLD, 5, "md", 12)
    outlined(d, (cx, H // 2 + 6), copy, bf, (255, 255, 255), 3, "ma", 14)
    nf = font(BODY_FONT, 22)
    outlined(d, (cx, H - 52), NAME, nf, (233, 217, 166), 3, "ms")
    return canvas.convert("RGB")


def save(img: Image.Image, path: str) -> None:
    buf = io.BytesIO()
    img.save(buf, "PNG", optimize=True)
    if buf.tell() > LIMIT:
        img = img.quantize(colors=256, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, "PNG", optimize=True)
    with open(path, "wb") as f:
        f.write(buf.getvalue())
    print(os.path.basename(path), img.size, f"{buf.tell() // 1024} KB")


if __name__ == "__main__":
    raw, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    for name in os.listdir(out):
        if name.endswith(".png"):
            os.remove(os.path.join(out, name))
    for i, (shots, bg, head, copy, left) in enumerate(SLIDES, 1):
        save(compose(raw, shots, bg, head, copy, left), os.path.join(out, f"{i}.png"))
