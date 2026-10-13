import { t } from "../i18n";
import { useFitText } from "./useFitText";
import type { GameState } from "../../shared/state";
import { Icon } from "./Icon";
import { NAV_OPEN_AT } from "../../shared/alerts";

export type NavTab = "sideJobs" | "gear" | "pets" | "certs" | "shop" | "dungeon";

// The bottom menu. A locked item still shows its name (with a lock); tapping it says where it opens.
const ITEMS: { id: NavTab; icon: string; label: string; openAt: number }[] = [
  { id: "sideJobs", icon: "nav_sidejobs", label: "부업", openAt: NAV_OPEN_AT.sideJobs },
  { id: "gear", icon: "nav_gear", label: "장비", openAt: NAV_OPEN_AT.gear },
  { id: "pets", icon: "nav_pets", label: "동료", openAt: NAV_OPEN_AT.pets },
  { id: "certs", icon: "nav_certs", label: "자격증", openAt: NAV_OPEN_AT.certs },
  { id: "shop", icon: "nav_shop", label: "상점", openAt: NAV_OPEN_AT.shop },
  { id: "dungeon", icon: "nav_dungeon", label: "던전", openAt: NAV_OPEN_AT.dungeon },
];

export function BottomNav({ state, tab, dots, onPick, onLocked }: {
  state: GameState; tab: NavTab; dots: Record<string, boolean>; onPick: (t: NavTab) => void; onLocked: (text: string) => void;
}) {
  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => {
        const open = state.bestFloor >= item.openAt;
        return (
          <button
            key={item.id}
            data-tut={`nav-${item.id}`}
            className={`${item.id === tab ? "on" : ""}${open ? "" : " locked"}`}
            onClick={() => (open ? onPick(item.id) : onLocked(t("{name}은(는) {floor}층에서 해금돼요", { name: t(item.label), floor: item.openAt })))}
          >
            <span className="icon"><Icon name={open ? item.icon : "lock"} /></span>
            <NavLabel text={t(item.label)} />
            {open && dots[item.id] && <i className="dot" />}
          </button>
        );
      })}
    </nav>
  );
}

function NavLabel({ text }: { text: string }) {
  const ref = useFitText<HTMLSpanElement>(text);
  return <span ref={ref} className="nav-label">{text}</span>;
}
