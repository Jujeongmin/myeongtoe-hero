import { useEffect, useMemo, useState } from "react";
import { GameStore } from "./game/store";
import { useGameView } from "./game/useGameView";
import { LocalTransport } from "./net/transport";
import { Battle } from "./ui/Battle";
import { GearPanel } from "./ui/GearPanel";
import { SideJobPanel } from "./ui/SideJobPanel";
import { Toast } from "./ui/Toast";
import { TopBar } from "./ui/TopBar";

const SYNC_MS = 1500;

type Tab = "gear" | "sideJobs";
const TABS: { id: Tab; label: string }[] = [
  { id: "gear", label: "장비" },
  { id: "sideJobs", label: "부업" },
];

export default function App() {
  const store = useMemo(() => new GameStore(new LocalTransport(window.localStorage)), []);
  const state = useGameView(store);
  const [tab, setTab] = useState<Tab>("gear");

  useEffect(() => {
    const tick = () => void store.flush().catch(() => undefined);
    tick();
    const id = setInterval(tick, SYNC_MS);
    return () => clearInterval(id);
  }, [store]);

  if (!state) return <div className="screen">출근 중…</div>;

  return (
    <div className="phone">
      <TopBar state={state} />
      <Battle state={state} />
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={t.id === tab ? "tab on" : "tab"} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      <main className="list">
        {tab === "gear" ? <GearPanel state={state} store={store} /> : <SideJobPanel state={state} store={store} />}
      </main>
      <Toast store={store} />
    </div>
  );
}
