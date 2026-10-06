import { useEffect, useState } from "react";
import { displayName, readNickname, type Board, type RankingView } from "../../shared/ranking";
import type { GameState } from "../../shared/state";
import type { GameStore } from "../game/store";
import { errorText } from "./text";

const BOARDS: { id: Board; label: string }[] = [
  { id: "floor", label: "최고 층" },
  { id: "depth", label: "지하주차장" },
];

function score(board: Board, row: { floor: number; depth: number }): string {
  return board === "floor" ? `${row.floor}층` : `B${row.depth}m`;
}

// Top 50 per board and the player's own row; the nickname is set here too.
export function RankingSheet({ state, store }: { state: GameState; store: GameStore }) {
  const [board, setBoard] = useState<Board>("floor");
  const [view, setView] = useState<RankingView | null>(null);
  const [failed, setFailed] = useState(false);

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
      <NicknameRow state={state} store={store} />
      <div className="tabs">
        {BOARDS.map((b) => (
          <button key={b.id} className={b.id === board ? "on" : ""} onClick={() => setBoard(b.id)}>{b.label}</button>
        ))}
      </div>
      {failed && <div className="row">랭킹은 서버에 연결됐을 때 볼 수 있어요</div>}
      {!failed && !view && <div className="row">불러오는 중…</div>}
      {view && (
        <>
          {view.mine && (
            <div className="row current">
              <span className="grow">내 기록 · {displayName(view.mine)}</span>
              <span>{score(board, view.mine)}</span>
            </div>
          )}
          {view.rows.length === 0 && <div className="row">아직 기록이 없어요</div>}
          {view.rows.map((row, i) => (
            <div key={row.account} className={`row${row.account === view.mine?.account ? " current" : ""}`}>
              <span className="rank">{i + 1}</span>
              <span className="grow">{displayName(row)}</span>
              <span>{score(board, row)}</span>
            </div>
          ))}
        </>
      )}
    </>
  );
}

function NicknameRow({ state, store }: { state: GameState; store: GameStore }) {
  const [name, setName] = useState(state.nickname);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!readNickname(name)) {
      setMessage(errorText("bad_nickname"));
      return;
    }
    setBusy(true);
    try {
      await store.setNickname(name);
      setMessage("닉네임을 바꿨어요");
    } catch (error) {
      setMessage(errorText(error instanceof Error ? error.message : ""));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="row">
      <div className="grow">
        닉네임
        <input
          className="text-input"
          value={name}
          maxLength={8}
          placeholder="2~8자"
          onChange={(e) => setName(e.target.value)}
        />
        {message && <div className="sub">{message}</div>}
      </div>
      <button disabled={busy || name.trim() === state.nickname} onClick={() => void save()}>저장</button>
    </div>
  );
}
