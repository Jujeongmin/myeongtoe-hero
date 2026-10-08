import { LOCALES, setLocale, t, useLocale, type Locale } from "../i18n";
import { useRef, useState } from "react";
import { getVolumes, setVolumes, sfx, type Volumes } from "../game/audio";
import { formatBig } from "../../shared/format";
import type { GameState } from "../../shared/state";

const DOUBLE_TAP_MS = 400;

// Against screen burn-in while the game is left running: black, only the floor and gold, small.
// Two taps close it. The game keeps going underneath.
export function ScreenLock({ state, onClose }: { state: GameState; onClose: () => void }) {
  const last = useRef(0);
  const tap = () => {
    const now = Date.now();
    if (now - last.current < DOUBLE_TAP_MS) onClose();
    last.current = now;
  };
  return (
    <div className="screen-lock" onClick={tap}>
      <div className="sub">{t("{floor}층 · 골드 {gold}", { floor: state.run.floor, gold: formatBig(state.gold) })}</div>
      <div className="sub">{t("두 번 탭하면 돌아가요")}</div>
    </div>
  );
}

// Settings: for now the screen lock.
// One volume (0–100%): moving it changes the sound at once; letting go of the effects one plays a
// click at the new level.
function VolumeRow({ label, value, onChange, onDone }: { label: string; value: number; onChange: (v: number) => void; onDone?: () => void }) {
  return (
    <div className="row volume-row">
      <div className="grow">{label}</div>
      <input
        type="range" className="volume" min={0} max={100} step={5} value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)} onPointerUp={onDone} onKeyUp={onDone}
      />
      <span className="volume-n">{Math.round(value * 100)}</span>
    </div>
  );
}

export function SettingsPanel({ onLock }: { onLock: () => void }) {
  const current = useLocale();
  const [vol, setVol] = useState<Volumes>(getVolumes());
  const change = (next: Volumes) => {
    setVol(next);
    setVolumes(next);
  };
  return (
    <>
    <VolumeRow label={t("효과음")} value={vol.sfx} onChange={(v) => change({ ...vol, sfx: v })} onDone={() => sfx("tap")} />
    <VolumeRow label={t("배경음")} value={vol.bgm} onChange={(v) => change({ ...vol, bgm: v })} />
    <div className="row">
      <div className="grow">
        {t("언어")}
        <div className="sub">Language</div>
      </div>
      <select className="lang-select" value={current} onChange={(e) => setLocale(e.target.value as Locale)}>
        {LOCALES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
      </select>
    </div>
    <div className="row">
      <div className="grow">
        {t("화면 잠금")}
        <div className="sub">{t("켜 둔 채로 둘 때 화면을 어둡게 해요. 게임은 계속 진행돼요.")}</div>
      </div>
      <button onClick={onLock}>{t("잠금")}</button>
    </div>
    </>
  );
}
