import type { GameState } from "../../shared/state";
import { Icon } from "./Icon";

export type NavTab = "sideJobs" | "gear" | "pets" | "certs" | "shop" | "dungeon";

// The bottom menu. A locked item still shows its name (with a lock); tapping it says where it opens.
const ITEMS: { id: NavTab; icon: string; label: string; openAt: number }[] = [
  { id: "sideJobs", icon: "nav_sidejobs", label: "부업", openAt: 1 },
  { id: "gear", icon: "nav_gear", label: "장비", openAt: 1 },
  { id: "pets", icon: "nav_pets", label: "동료", openAt: 100 },
  { id: "certs", icon: "nav_certs", label: "자격증", openAt: 11 },
  { id: "shop", icon: "nav_shop", label: "상점", openAt: 1 },
  { id: "dungeon", icon: "nav_dungeon", label: "던전", openAt: 5 },
];

export function BottomNav({ state, tab, onPick, onLocked }: {
  state: GameState; tab: NavTab; onPick: (t: NavTab) => void; onLocked: (text: string) => void;
}) {
  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => {
        const open = state.bestFloor >= item.openAt;
        return (
          <button
            key={item.id}
            className={`${item.id === tab ? "on" : ""}${open ? "" : " locked"}`}
            onClick={() => (open ? onPick(item.id) : onLocked(`${item.label}은(는) ${item.openAt}층에서 해금돼요`))}
          >
            <span className="icon"><Icon name={open ? item.icon : "lock"} /></span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
