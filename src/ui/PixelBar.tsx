// A 3-slice pixel-art bar (art/ui): the empty bar, the fill cut to `value` (0..1), the frame on top.
export function PixelBar({ kind, value }: { kind: "progress" | "hp"; value: number }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <span className={`pbar pbar-${kind}`}>
      <i className="empty" />
      <i className="fill" style={{ clipPath: `inset(0 ${Math.round((1 - v) * 1000) / 10}% 0 0)` }} />
      <i className="frame" />
    </span>
  );
}
