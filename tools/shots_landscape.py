"""Puts each phone screenshot (480x720 at 2x) in the middle of a 16:9 frame, 1280x720, over a blurred,
darkened copy of itself; saves 1.png, 2.png, ... under 1 MB each (PNG, falling back to JPEG).
usage: python tools/shots_landscape.py <raw dir> <out dir>"""
import os
import sys
from PIL import Image, ImageEnhance, ImageFilter

W, H = 1280, 720
LIMIT = 1_000_000


def frame(phone: Image.Image) -> Image.Image:
    phone = phone.convert("RGB").resize((480, 720), Image.LANCZOS)
    bg = phone.resize((W, int(W * 720 / 480)), Image.LANCZOS)
    top = (bg.height - H) // 2
    bg = bg.crop((0, top, W, top + H)).filter(ImageFilter.GaussianBlur(22))
    bg = ImageEnhance.Brightness(bg).enhance(0.45)
    out = bg.copy()
    x = (W - 480) // 2
    # a thin dark rim so the phone screen reads against its own blur
    out.paste(Image.new("RGB", (486, 726), (8, 6, 16)), (x - 3, -3))
    out.paste(phone, (x, 0))
    return out


def main(raw: str, out: str) -> None:
    os.makedirs(out, exist_ok=True)
    files = sorted((f for f in os.listdir(raw) if f.endswith(".png")), key=lambda f: int(f.split(".")[0]))
    for f in files:
        n = f.split(".")[0]
        img = frame(Image.open(os.path.join(raw, f)))
        png = os.path.join(out, f"{n}.png")
        img.save(png, optimize=True)
        size = os.path.getsize(png)
        if size > LIMIT:
            img.quantize(colors=128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(png, optimize=True)
            size = os.path.getsize(png)
        print(f"{n}.png {img.size} {size / 1024:.0f} KB")


main(sys.argv[1], sys.argv[2])
