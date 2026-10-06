import type { GameState } from "../../shared/state";

export type NavTab = "sideJobs" | "gear" | "pets" | "certs" | "shop" | "dungeon";

// The original's bottom menu (퀘스트, 무기, 펫, 보물, 상점, 던전), locked until it opens.
const ITEMS: { id: NavTab; icon: string; label: string; open: (s: GameState) => boolean; hint: string }[] = [
  { id: "sideJobs", icon: "📋", label: "부업", open: () => true, hint: "" },
  { id: "gear", icon: "🖊", label: "장비", open: () => true, hint: "" },
  { id: "pets", icon: "🧑‍💼", label: "동료", open: (s) => s.bestFloor >= 100, hint: "100층" },
  { id: "certs", icon: "📜", label: "자격증", open: (s) => s.bestFloor >= 11, hint: "11층" },
  { id: "shop", icon: "🛒", label: "상점", open: () => false, hint: "준비 중" },
  { id: "dungeon", icon: "🅿", label: "던전", open: () => false, hint: "준비 중" },
];

export function BottomNav({ state, tab, onPick }: { state: GameState; tab: NavTab; onPick: (t: NavTab) => void }) {
  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => {
        const open = item.open(state);
        return (
          <button key={item.id} className={item.id === tab ? "on" : ""} disabled={!open} onClick={() => onPick(item.id)}>
            <span className="icon">{open ? item.icon : "🔒"}</span>
            {open ? item.label : item.hint}
          </button>
        );
      })}
    </nav>
  );
}
