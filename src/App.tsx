import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { GameState } from "../shared/state";
import { Icon } from "./ui/Icon";
import { formatCount } from "../shared/format";
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
import { PrestigeCutscene } from "./ui/PrestigeCutscene";
import type { PrestigeMode } from "../shared/data/prestige";
import { RankingSheet } from "./ui/RankingSheet";
import { ShopPanel } from "./ui/ShopPanel";
import { ScreenLock, SettingsPanel } from "./ui/ScreenLock";
import { PlusButton, type GetMore, type ShopTab } from "./ui/CurrencyBar";
import { ProfilePanel } from "./ui/ProfilePanel";
import { Tutorial } from "./ui/Tutorial";
import { Welcome, welcomeNeeded } from "./ui/Welcome";
import { Sheet } from "./ui/Sheet";
import { SideJobPanel } from "./ui/SideJobPanel";
import { StatusBanner } from "./ui/StatusBanner";
import { StoryList, StoryViewer, storyToShow } from "./ui/StoryViewer";
import type { Episode } from "../shared/data/story";
import { offerToShow, type Offer } from "../shared/data/shop";
import { AttendancePopup, OfferPopup, attendanceDue, markOfferSeen, seenOffers } from "./ui/Popups";
import { idleFor } from "./ui/useTapGuard";
import { Toast } from "./ui/Toast";

const SYNC_MS = 1500;
// What opens by itself waits until the player has stopped tapping for this long.
const IDLE_MS = 1500;

const SHEET_THEMES: Partial<Record<SheetId, string>> = {
  profile: "profile", suits: "costume", apartment: "apartment", relics: "relics", office: "office",
  missions: "missions", ranking: "ranking", settings: "settings", story: "story",
};

// What each menu spends: 코스튬 (buy and rent with 상품권, 불꽃 with 보석), 아파트 and 기념품
// (보석), 사무용품 (상품권).
// Each counter shows the same icon as the battle screen's, and a "+" to the shop.
function walletFor(sheet: SheetId, state: GameState, getMore: GetMore): ReactNode {
  const coupons = <span className="wallet-pill"><Icon name="coupon" /><b>{formatCount(state.coupons)}</b><PlusButton onClick={() => getMore("ads")} /></span>;
  const gems = <span className="wallet-pill"><Icon name="gem" /><b>{formatCount(state.gems)}</b><PlusButton onClick={() => getMore("vx")} /></span>;
  if (sheet === "suits") return <>{coupons} {gems}</>;
  if (sheet === "apartment" || sheet === "relics") return gems;
  if (sheet === "office") return coupons;
  return null;
}

const SHEET_TITLES: Record<SheetId, string> = {
  profile: "명함", prestige: "연봉협상", suits: "코스튬", apartment: "아파트", relics: "퇴직 기념품", office: "사무용품",
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
  const [popup, setPopup] = useState<"attendance" | Offer | null>(null);
  const [attendanceAsked, setAttendanceAsked] = useState(false);
  const [offered, setOffered] = useState(false);
  const [nego, setNego] = useState<{ mode: PrestigeMode; tickets: number; gems: number } | null>(null);
  const [welcomed, setWelcomed] = useState(false);
  const [shopTab, setShopTab] = useState<{ tab: ShopTab; at: number }>({ tab: "gems", at: 0 });
  // A currency's "+": the shop, opened at the part that gives more of it.
  const getMore: GetMore = (to) => {
    setSheet(null);
    setTab("shop");
    setShopTab({ tab: to, at: Date.now() });
  };
  const welcome = !!state && !welcomed && welcomeNeeded(state, guest);

  // What opens by itself, one thing at a time, only over the bare battle screen and only once the
  // player has stopped tapping for a moment (a burst of 강화 taps must not land on it): the
  // prologue before anything, then attendance (once, on arriving), a new episode, and at most one
  // VX offer a session. Checked on every redraw.
  useEffect(() => {
    if (!state || welcome || reading || popup || sheet || locked || nego || store.offline || !idleFor(IDLE_MS)) return;
    const ep = storyToShow(state);
    const story = ep && !shown.includes(ep.id) ? ep : undefined;
    const read = (e: Episode) => {
      setShown([...shown, e.id]);
      setReading(e);
    };
    if (story && state.story.length === 0) return read(story);
    if (!attendanceAsked) {
      setAttendanceAsked(true);
      if (attendanceDue(state)) return setPopup("attendance");
    }
    if (story) return read(story);
    if (!offered) {
      const offer = offerToShow(state, seenOffers());
      if (offer) {
        setOffered(true);
        markOfferSeen(offer.key);
        setPopup(offer);
      }
    }
  });

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
        getMore={getMore}
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
        {tab === "shop" && <ShopPanel key={shopTab.at} state={state} store={store} initial={shopTab.tab} />}
      </main>
      <BottomNav state={state} tab={tab} onPick={setTab} onLocked={(text) => store.notify(text)} />
      {!welcome && <Tutorial state={state} tab={tab} />}
      {sheet === "prestige" && (
        <PrestigePanel
          state={state}
          onSign={(mode, tickets, gems) => {
            setSheet(null);
            setNego({ mode, tickets, gems });
          }}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet && sheet !== "prestige" && (
        <Sheet title={t(SHEET_TITLES[sheet])} theme={SHEET_THEMES[sheet]} wallet={walletFor(sheet, state, getMore)} onClose={() => setSheet(null)}>
          {sheet === "profile" && <ProfilePanel state={state} store={store} guest={guest} />}
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
      {popup === "attendance" && <AttendancePopup state={state} store={store} onClose={() => setPopup(null)} />}
      {popup && popup !== "attendance" && <OfferPopup offer={popup} onClose={() => setPopup(null)} />}
      {nego && (
        <PrestigeCutscene
          tickets={nego.tickets}
          gems={nego.gems}
          commit={() => store.do({ k: "prestige", mode: nego.mode })}
          onDone={() => setNego(null)}
        />
      )}
      {welcome && <Welcome state={state} store={store} guest={guest} onDone={() => setWelcomed(true)} />}
      {locked && <ScreenLock state={state} onClose={() => setLocked(false)} />}
    </div>
  );
}
