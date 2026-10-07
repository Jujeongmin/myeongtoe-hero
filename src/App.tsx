import { useEffect, useMemo, useState } from "react";
import { useGameServer } from "@agent8/gameserver";
import { GameStore } from "./game/store";
import { useGameView } from "./game/useGameView";
import { t, useLocale } from "./i18n";
import { connectionOf, shouldPlayLocally, type Connection } from "./net/connection";
import { loginState } from "./net/login";
import { LocalTransport, OFFLINE } from "./net/transport";
import { onShopClosed, startShop } from "./net/shop";
import { Verse8Transport } from "./net/verse8Transport";
import { getUser } from "@verse8/platform";
import { Battle, type SheetId } from "./ui/Battle";
import { BottomNav, type NavTab } from "./ui/BottomNav";
import { CertPanel } from "./ui/CertPanel";
import { GearPanel } from "./ui/GearPanel";
import { MissionSheet } from "./ui/MissionSheet";
import { ParkingPanel } from "./ui/ParkingPanel";
import { ApartmentPanel, OfficePanel, RelicPanel } from "./ui/HomePanels";
import { CostumePanel } from "./ui/CostumePanel";
import { OfflinePopup } from "./ui/OfflinePopup";
import { PetPanel } from "./ui/PetPanel";
import { PrestigePanel } from "./ui/PrestigePanel";
import { RankingSheet } from "./ui/RankingSheet";
import { ShopPanel } from "./ui/ShopPanel";
import { ScreenLock, SettingsPanel } from "./ui/ScreenLock";
import { Sheet } from "./ui/Sheet";
import { SideJobPanel } from "./ui/SideJobPanel";
import { StatusBanner } from "./ui/StatusBanner";
import { StoryList, StoryViewer, storyToShow } from "./ui/StoryViewer";
import type { Episode } from "../shared/data/story";
import { Toast } from "./ui/Toast";

const SYNC_MS = 1500;

const SHEET_TITLES: Record<SheetId, string> = {
  prestige: "이직", suits: "코스튬", apartment: "아파트", relics: "퇴직 기념품", office: "사무용품",
  missions: "미션", ranking: "랭킹", settings: "설정", story: "스토리",
};

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

  // The VX Shop: started for this account, and a sync after its dialog closes so a purchase shows.
  useEffect(() => {
    try {
      startShop(getUser().account);
    } catch {
      // Not logged in to Verse8: no shop.
    }
    return onShopClosed((_, purchased) => {
      if (purchased) void store.syncNow().catch(() => undefined);
    });
  }, [store]);

  useEffect(() => {
    if (fallback) store.setTransport(new LocalTransport(window.localStorage));
    else store.setTransport(connected ? new Verse8Transport(server) : OFFLINE);
  }, [store, server, connected, fallback]);

  return <Game store={store} connection={fallback ? "fallback" : connection} guest={guest && !fallback} />;
}

function Game({ store, connection, guest }: { store: GameStore; connection: Connection; guest: boolean }) {
  useLocale(); // a language change re-renders every screen
  const state = useGameView(store);
  const [tab, setTab] = useState<NavTab>("gear");
  const [sheet, setSheet] = useState<SheetId | null>(null);
  const [locked, setLocked] = useState(false);
  const [reading, setReading] = useState<Episode | null>(null);
  const [shown, setShown] = useState<string[]>([]);

  // A new episode opens by itself once (over the battle, when no panel is open).
  useEffect(() => {
    if (!state || reading || sheet || locked) return;
    const ep = storyToShow(state);
    if (ep && !shown.includes(ep.id)) {
      setShown([...shown, ep.id]);
      setReading(ep);
    }
  }, [state, reading, sheet, locked, shown]);

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
          <p>{t("서버에 연결하지 못했어요")}</p>
          <button onClick={() => window.location.reload()}>{t("다시 시도")}</button>
        </div>
      );
    }
    return <div className="screen">{connection === "trying" ? t("서버에 연결하는 중…") : t("출근 중…")}</div>;
  }

  return (
    <div className="phone">
      <StatusBanner connection={connection} guest={guest} />
      <Battle
        state={state}
        store={store}
        onOpen={setSheet}
        onGo={(place) => {
          if ("tab" in place) {
            setSheet(null);
            setTab(place.tab);
          } else setSheet(place.sheet);
        }}
      />
      <main className="list">
        {tab === "sideJobs" && <SideJobPanel state={state} store={store} />}
        {tab === "gear" && <GearPanel state={state} store={store} onSuits={() => setSheet("suits")} />}
        {tab === "pets" && <PetPanel state={state} store={store} />}
        {tab === "certs" && <CertPanel state={state} store={store} />}
        {tab === "dungeon" && <ParkingPanel state={state} store={store} />}
        {tab === "shop" && <ShopPanel state={state} store={store} />}
      </main>
      <BottomNav state={state} tab={tab} onPick={setTab} onLocked={(text) => store.notify(text)} />
      {sheet && (
        <Sheet title={t(SHEET_TITLES[sheet])} onClose={() => setSheet(null)}>
          {sheet === "prestige" && <PrestigePanel state={state} store={store} />}
          {sheet === "suits" && <CostumePanel state={state} store={store} />}
          {sheet === "apartment" && <ApartmentPanel state={state} store={store} />}
          {sheet === "relics" && <RelicPanel state={state} store={store} />}
          {sheet === "office" && <OfficePanel state={state} store={store} />}
          {sheet === "missions" && <MissionSheet state={state} store={store} />}
          {sheet === "ranking" && <RankingSheet state={state} store={store} />}
          {sheet === "story" && <StoryList state={state} onRead={setReading} />}
          {sheet === "settings" && (
            <SettingsPanel
              onLock={() => {
                setSheet(null);
                setLocked(true);
              }}
            />
          )}
        </Sheet>
      )}
      <OfflinePopup store={store} />
      <Toast store={store} />
      {reading && (
        <StoryViewer
          episode={reading}
          onClose={() => {
            if (!state.story.includes(reading.id)) store.do({ k: "readStory", id: reading.id });
            setReading(null);
          }}
        />
      )}
      {locked && <ScreenLock state={state} onClose={() => setLocked(false)} />}
    </div>
  );
}
