import { iconUrl } from "../game/sprites";

// A 32×32 pixel icon from art/icons, drawn at `size` (a multiple of 16 keeps it crisp).
export function Icon({ name, size = 32 }: { name: string; size?: number }) {
  const src = iconUrl(name);
  if (!src) return null;
  return <img className="icon-img" src={src} width={size} height={size} alt="" draggable={false} />;
}
