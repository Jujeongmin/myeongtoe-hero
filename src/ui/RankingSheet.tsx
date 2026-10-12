import { useEffect, useState } from "react";
import { findSuitItem } from "../../shared/data/costumes";
import { displayName, type Board, type PublicProfile, type RankRow, type RankingView } from "../../shared/ranking";
import type { GameState } from "../../shared/state";
import type { GameStore } from "../game/store";
import { t } from "../i18n";
import { CostumeThumb, Preview } from "./CostumePanel";

const BOARDS: { id: Board; label: string }[] = [
  { id: "floor", label: "최고 층" },
  { id: "depth", label: "지하주차장" },
];

function score(board: Board, row: { floor: number; depth: number }): string {
  return board === "floor" ? t("{floor}층", { floor: row.floor }) : `B${row.depth}m`;
}

function nameOf(row: RankRow): string {
  const name = displayName(row);
  return t(name.key, name.vars);
}

// Top 50 per board and the player's own row (the nickname is set in the profile).
export function RankingSheet({ state, store }: { state: GameState; store: GameStore }) {
  const [board, setBoard] = useState<Board>("floor");
  const [view, setView] = useState<RankingView | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<RankRow | null>(null);

  useEffect(() => {
    let live = true;
    setView(null);
    setFailed(false);
    store.ranking(board).then(
      (v) => live && setView(v),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [store, board, state.nickname]);

  return (
    <>
      <div className="tabs">
        {BOARDS.map((b) => (
          <button key={b.id} className={b.id === board ? "on" : ""} onClick={() => setBoard(b.id)}>{t(b.label)}</button>
        ))}
      </div>
      {failed && <div className="row">{t("랭킹은 서버에 연결됐을 때 볼 수 있어요")}</div>}
      {!failed && !view && <div className="row">{t("불러오는 중…")}</div>}
      {view && (
        <>
          {view.mine && (
            <div className="row current tappable" onClick={() => setOpen(view.mine)}>
              <span className="grow">{t("내 기록 · {name}", { name: nameOf(view.mine) })}</span>
              <span>{score(board, view.mine)}</span>
            </div>
          )}
          {view.rows.length === 0 && <div className="row">{t("아직 기록이 없어요")}</div>}
          {view.rows.map((row, i) => (
            <div key={row.account} className={`row tappable${row.account === view.mine?.account ? " current" : ""}`} onClick={() => setOpen(row)}>
              <span className="rank">{i + 1}</span>
              <span className="grow">{nameOf(row)}</span>
              <span>{score(board, row)}</span>
            </div>
          ))}
        </>
      )}
      {open && <ProfileCard row={open} store={store} onClose={() => setOpen(null)} />}
    </>
  );
}

// A player's card from the boards: Park as they dressed him, and their records.
function ProfileCard({ row, store, onClose }: { row: RankRow; store: GameStore; onClose: () => void }) {
  const [p, setP] = useState<PublicProfile | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    store.profile(row.account).then(
      (v) => live && setP(v),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [store, row.account]);
  const worn = p ? Object.values(p.wear).map(findSuitItem).filter((x) => x !== undefined) : [];
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal profile-card" onClick={(e) => e.stopPropagation()}>
        <h3>{nameOf(row)}</h3>
        {failed && <p className="sub">{t("프로필을 불러오지 못했어요")}</p>}
        {!failed && !p && <p className="sub">{t("불러오는 중…")}</p>}
        {p && (
          <>
            <div className="profile-card-top">
              <Preview wear={p.wear} gearTier={p.gearTier} />
              <div className="profile-card-stats">
                <div>{t("최고 층")} <b>{t("{floor}층", { floor: p.floor })}</b></div>
                <div>{t("지하주차장")} <b>B{p.depth}m</b></div>
                <div>{t("연봉협상")} <b>{t("{n}회", { n: p.prestiges })}</b></div>
                <div>{t("코스튬")} <b>{p.costumes}/{p.costumesAll}</b></div>
              </div>
            </div>
            {worn.length > 0 ? (
              <div className="profile-card-worn">
                {worn.map((item) => (
                  <div key={item.id} className="profile-card-piece">
                    <CostumeThumb item={item} />
                    <div className="sub">{t(item.name)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="sub">{t("입은 코스튬이 없어요")}</p>
            )}
          </>
        )}
        <button onClick={onClose}>{t("닫기")}</button>
      </div>
    </div>
  );
}
