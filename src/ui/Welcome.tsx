import { useState } from "react";
import type { GameState } from "../../shared/state";
import type { GameStore } from "../game/store";
import { LOCALES, locale, localeChosen, setLocale, t } from "../i18n";
import { NicknameField } from "./ProfilePanel";

// Whether the first-launch form still has something to ask: a language (none picked yet) or a
// name (signed-in players without a nickname).
export function welcomeNeeded(state: GameState, guest: boolean): boolean {
  return !localeChosen() || (!guest && !state.nickname);
}

// The first launch, as 마왕그룹's 입사지원서: first the language (each in its own words, the
// device's preselected), then the name. The prologue follows once it closes.
export function Welcome({ state, store, guest, onDone }: { state: GameState; store: GameStore; guest: boolean; onDone: () => void }) {
  const [step, setStep] = useState<"lang" | "name">(localeChosen() ? "name" : "lang");
  const [pick, setPick] = useState(locale());
  const next = () => (guest || state.nickname ? onDone() : setStep("name"));
  return (
    <div className="welcome">
      <div className="welcome-form">
        <h2>{t("입사지원서")}</h2>
        <div className="sub">{t("마왕그룹 본사 · 용사 채용")}</div>
        {step === "lang" ? (
          <>
            <div className="welcome-label">Language</div>
            <div className="welcome-langs">
              {LOCALES.map((l) => (
                <button key={l.code} className={l.code === pick ? "hot" : ""} onClick={() => setPick(l.code)}>{l.name}</button>
              ))}
            </div>
            <button className="welcome-go" onClick={() => { setLocale(pick); next(); }}>{t("다음")}</button>
          </>
        ) : (
          <>
            <div className="welcome-label">{t("성명 (닉네임)")}</div>
            <NicknameField store={store} initial="" submit={t("제출")} done={onDone} />
            <div className="sub">{t("2~8자, 기호와 띄어쓰기 없이. 나중에 프로필에서 바꿀 수 있어요.")}</div>
          </>
        )}
      </div>
    </div>
  );
}
