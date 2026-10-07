import { iconUrl } from "../game/sprites";

// A 32×32 pixel icon from art/icons, drawn at `size` (a multiple of 16 keeps it crisp). At 16 the
// icon's own 16×16 drawing (`<name>_s`) is used when there is one: halving a 32 loses its detail.
export function Icon({ name, size = 32 }: { name: string; size?: number }) {
  const src = (size <= 16 && iconUrl(`${name}_s`)) || iconUrl(name);
  if (!src) return null;
  return <img className="icon-img" src={src} width={size} height={size} alt="" draggable={false} />;
}
