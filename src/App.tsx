import { useEffect, useMemo, useState } from "react";
import { useGameServer } from "@agent8/gameserver";
import { GameStore } from "./game/store";
import { useGameView } from "./game/useGameView";
import { connectionOf, shouldPlayLocally, type Connection } from "./net/connection";
import { loginState } from "./net/login";
import { LocalTransport, OFFLINE } from "./net/transport";
import { Verse8Transport } from "./net/verse8Transport";
import { Battle } from "./ui/Battle";
import { CertPanel } from "./ui/CertPanel";
import { GearPanel } from "./ui/GearPanel";
import { PrestigePanel } from "./ui/PrestigePanel";
import { SideJobPanel } from "./ui/SideJobPanel";
import { StatPanel } from "./ui/StatPanel";
import { StatusBanner } from "./ui/StatusBanner";
import { Toast } from "./ui/Toast";
import { TopBar } from "./ui/TopBar";

const SYNC_MS = 1500;

type Tab = "gear" | "sideJobs" | "stats" | "certs" | "prestige";
const TABS: { id: Tab; label: string }[] = [
  { id: "gear", label: "장비" },
  { id: "sideJobs", label: "부업" },
  { id: "stats", label: "강화" },
  { id: "certs", label: "자격증" },
  { id: "prestige", label: "이직" },
];

// Playing against the in-page server (no Verse8 project, or ?local in development).
export function LocalApp() {
  const store = useMemo(() => new GameStore(new LocalTransport(window.localStorage)), []);
  return <Game store={store} connection="local" guest={false} />;
}

// Playing against the Verse8 game server. The store outlives connection drops: while there is no
// connection its syncs fail and the player's taps stay queued, then go out once it is back. A
// development build that never reaches the server switches to the in-page one for the session
// (see shouldPlayLocally).
export function OnlineApp() {
  const { server, connected, connectionStatus } = useGameServer();
  const store = useMemo(() => new GameStore(OFFLINE), []);
  const guest = useMemo(() => loginState() === "guest", []);
  const [startedAt] = useState(() => Date.now());
  const [fallback, setFallback] = useState(false);
  const connection = connectionOf({ online: true, connected, phase: connectionStatus?.phase });

  useEffect(() => {
    if (fallback) return;
    const check = () => {
      const waitedMs = Date.now() - startedAt;
      if (shouldPlayLocally({ dev: import.meta.env.DEV, connection, synced: store.synced(), waitedMs })) setFallback(true);
    };
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [fallback, connection, store, startedAt]);

  useEffect(() => {
    if (fallback) store.setTransport(new LocalTransport(window.localStorage));
    else store.setTransport(connected ? new Verse8Transport(server) : OFFLINE);
  }, [store, server, connected, fallback]);

  return <Game store={store} connection={fallback ? "fallback" : connection} guest={guest && !fallback} />;
}

function Game({ store, connection, guest }: { store: GameStore; connection: Connection; guest: boolean }) {
  const state = useGameView(store);
  const [tab, setTab] = useState<Tab>("gear");

  useEffect(() => {
    const tick = () => void store.flush().catch(() => undefined);
    tick();
    const id = setInterval(tick, SYNC_MS);
    return () => clearInterval(id);
  }, [store]);

  if (!state) {
    if (connection === "failed") {
      return (
        <div className="screen">
          <p>서버에 연결하지 못했어요</p>
          <button onClick={() => window.location.reload()}>다시 시도</button>
        </div>
      );
    }
    return <div className="screen">{connection === "trying" ? "서버에 연결하는 중…" : "출근 중…"}</div>;
  }

  return (
    <div className="phone">
      <TopBar state={state} />
      <StatusBanner connection={connection} guest={guest} />
      <Battle state={state} />
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={t.id === tab ? "tab on" : "tab"} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      <main className="list">
        {tab === "gear" && <GearPanel state={state} store={store} />}
        {tab === "sideJobs" && <SideJobPanel state={state} store={store} />}
        {tab === "stats" && <StatPanel state={state} store={store} />}
        {tab === "certs" && <CertPanel state={state} store={store} />}
        {tab === "prestige" && <PrestigePanel state={state} store={store} />}
      </main>
      <Toast store={store} />
    </div>
  );
}
