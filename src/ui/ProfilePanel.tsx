import { useState } from "react";
import { departmentOf } from "../../shared/data/floors";
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

// 명함 (side menu): Park's business card, standing upright — company, face, name and title, then a
// few records — with the nickname to change under it.
export function ProfilePanel({ state, store, guest }: { state: GameState; store: GameStore; guest: boolean }) {
  return (
    <>
      <div className="biz-card">
        <div className="biz-company">{t("마왕그룹")}</div>
        <Icon name="side_profile" size={64} />
        <b className="biz-name">{state.nickname || t("이름 없음")}</b>
        <div className="biz-title">{t("마왕그룹 용사 (계약직)")}</div>
        <hr />
        <div className="biz-line">{t("소속")} <b>{t(departmentOf(state.run.floor))}</b></div>
        <div className="biz-line">{t("최고 기록")} <b>{t("{floor}층", { floor: state.bestFloor })}</b></div>
        <div className="biz-line">{t("연봉협상")} <b>{t("{n}번", { n: state.prestiges })}</b></div>
      </div>
      <div className="profile-label">{t("닉네임 바꾸기")}</div>
      {guest ? <div className="row"><span className="sub">{t("로그인하면 닉네임을 정할 수 있어요")}</span></div> : <NicknameField store={store} initial={state.nickname} submit={t("저장")} />}
    </>
  );
}
