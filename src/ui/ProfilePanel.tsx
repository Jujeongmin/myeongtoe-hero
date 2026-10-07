import { useState } from "react";
import { readNickname } from "../../shared/ranking";
import type { GameState } from "../../shared/state";
import type { GameStore } from "../game/store";
import { t } from "../i18n";
import { Icon } from "./Icon";
import { errorText } from "./text";

// The nickname box with its save button, checked before it goes to the server. `done` runs after
// a successful save.
export function NicknameField({ store, initial, submit, done }: { store: GameStore; initial: string; submit: string; done?: () => void }) {
  const [name, setName] = useState(initial);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!readNickname(name)) {
      setMessage(errorText("bad_nickname"));
      return;
    }
    setBusy(true);
    try {
      await store.setNickname(name.trim());
      setMessage(t("닉네임을 바꿨어요"));
      done?.();
    } catch (error) {
      setMessage(errorText(error instanceof Error ? error.message : ""));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="row nickname-field">
      <div className="grow">
        <input
          className="text-input"
          value={name}
          maxLength={8}
          placeholder={t("2~8자")}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void save()}
        />
        {message && <div className="sub">{message}</div>}
      </div>
      <button className="hot" disabled={busy || name.trim() === "" || name.trim() === initial} onClick={() => void save()}>{submit}</button>
    </div>
  );
}

// 프로필 (side menu): Park's employee ID card — the nickname to change, and a few records.
export function ProfilePanel({ state, store, guest }: { state: GameState; store: GameStore; guest: boolean }) {
  return (
    <>
      <div className="row profile-card">
        <Icon name="side_profile" size={64} />
        <div className="grow">
          <b>{state.nickname || t("이름 없음")}</b>
          <div className="sub">{t("마왕그룹 용사 (계약직)")}</div>
          <div className="sub">{t("최고 {floor}층 · 이직 {n}번", { floor: state.bestFloor, n: state.prestiges })}</div>
        </div>
      </div>
      <div className="profile-label">{t("닉네임 바꾸기")}</div>
      {guest ? <div className="row"><span className="sub">{t("로그인하면 닉네임을 정할 수 있어요")}</span></div> : <NicknameField store={store} initial={state.nickname} submit={t("저장")} />}
    </>
  );
}
