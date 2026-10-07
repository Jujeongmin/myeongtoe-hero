import { useEffect, useRef } from "react";
import { image } from "../game/sprites";

// The first frame of a sprite strip, cropped to its pixels and scaled up by a whole number to fill
// a `res`×`res` canvas (shown at `size` CSS px). Used for costume pieces and the boss portrait.
export function SpriteThumb({ path, frame, res = 40, size = res, className, head }: {
  path: string; frame: number; res?: number; size?: number; className?: string;
  head?: boolean; // only the top square of the sprite (its head), for small portraits
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let timer = 0;
    const draw = () => {
      const img = image(path);
      const canvas = ref.current;
      if (!img || !canvas) {
        timer = window.setTimeout(draw, 100);
        return;
      }
      const fh = img.height;
      const cell = document.createElement("canvas");
      cell.width = frame;
      cell.height = fh;
      const cctx = cell.getContext("2d")!;
      cctx.drawImage(img, 0, 0, frame, fh, 0, 0, frame, fh);
      const px = cctx.getImageData(0, 0, frame, fh).data;
      let x0 = frame, y0 = fh, x1 = -1, y1 = -1;
      for (let y = 0; y < fh; y++) for (let x = 0; x < frame; x++) {
        if (px[(y * frame + x) * 4 + 3] === 0) continue;
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, res, res);
      if (x1 < 0) return;
      const w = x1 - x0 + 1, h = head ? Math.min(y1 - y0 + 1, x1 - x0 + 1) : y1 - y0 + 1;
      // Whole-number scale-up; a sprite bigger than the canvas shrinks to fit instead.
      const fit = Math.min(res / w, res / h);
      const k = fit >= 1 ? Math.floor(fit) : fit;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(cell, x0, y0, w, h, Math.floor((res - w * k) / 2), Math.floor((res - h * k) / 2), Math.round(w * k), Math.round(h * k));
    };
    draw();
    return () => window.clearTimeout(timer);
  }, [path, frame, res, head]);
  return <canvas ref={ref} className={className} width={res} height={res} style={{ width: size, height: size, imageRendering: "pixelated" }} />;
}
