import { LOCALES, setLocale, t, useLocale, type Locale } from "../i18n";
import { useRef, useState } from "react";
import { getVolumes, setVolumes, sfx, type Volumes } from "../game/audio";
import { iconUrl } from "../game/sprites";
import { PixelBar } from "./PixelBar";
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
const KNOB_HALF = 7; // the knob is 14 px wide; its middle never leaves the track

// One volume (0–100%) as a pixel fader: the progress bar for the track, a metal knob to drag (or
// tap the track, or use the arrow keys). The speaker/note on the left mutes it, and a second tap
// brings the level back. Letting go of the effects one plays a click at the new level.
function VolumeRow({ label, icon, value, onChange, onDone }: {
  label: string; icon: "vol_sfx" | "vol_bgm"; value: number; onChange: (v: number) => void; onDone?: () => void;
}) {
  const track = useRef<HTMLSpanElement>(null);
  const before = useRef(value > 0 ? value : 0.5);
  const at = (clientX: number) => {
    const r = track.current?.getBoundingClientRect();
    if (!r) return;
    onChange(Math.round(Math.max(0, Math.min(1, (clientX - r.left - KNOB_HALF) / (r.width - 2 * KNOB_HALF))) * 20) / 20);
  };
  const mute = () => {
    if (value > 0) {
      before.current = value;
      onChange(0);
    } else onChange(before.current);
  };
  const src = iconUrl(value > 0 ? icon : "vol_mute");
  return (
    <div className="row volume-row">
      <button className="volume-icon" aria-label={label} onClick={mute}>{src && <img src={src} alt="" draggable={false} />}</button>
      <div className="grow">{label}</div>
      <span
        ref={track}
        className="volume"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          at(e.clientX);
        }}
        onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && at(e.clientX)}
        onPointerUp={() => onDone?.()}
        onKeyDown={(e) => {
          const step = e.key === "ArrowRight" || e.key === "ArrowUp" ? 0.05 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -0.05 : 0;
          if (!step) return;
          e.preventDefault();
          onChange(Math.round(Math.max(0, Math.min(1, value + step)) * 20) / 20);
          onDone?.();
        }}
      >
        <PixelBar kind="progress" value={value} />
        <i className="volume-knob" style={{ left: `calc(${KNOB_HALF}px + (100% - ${2 * KNOB_HALF}px) * ${value})` }} />
      </span>
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
    <VolumeRow label={t("효과음")} icon="vol_sfx" value={vol.sfx} onChange={(v) => change({ ...vol, sfx: v })} onDone={() => sfx("tap")} />
    <VolumeRow label={t("배경음")} icon="vol_bgm" value={vol.bgm} onChange={(v) => change({ ...vol, bgm: v })} />
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
