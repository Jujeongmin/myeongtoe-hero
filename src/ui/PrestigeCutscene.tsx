import { useEffect, useRef, useState } from "react";
import { formatCount } from "../../shared/format";
import { sfx } from "../game/audio";
import { imageUrl } from "../game/sprites";
import { t } from "../i18n";
import { Amount } from "./Amount";

// 연봉협상 signed: the screen goes dark, the contract comes up, the seal comes down on it (a thud,
// a shake, a big red stamp and 연봉협상 타결!), the tickets count up, then everything fades to black.
// Under the black the negotiation goes through (`commit`: back to 1층), a line says so, and the game
// fades back in. A tap skips ahead to the fade.
const AT = { drop: 450, hit: 700, reward: 1150, out: 2700, commit: 3050, in: 3650, done: 4150 };
const COUNT_MS = 900;
// The contract (art/ui/nego_contract.png, 128 px) is shown at 2×; its seal circle is centred here.
const SCALE = 2;
const SEAL_AT = { x: 57, y: 103.5 };

type Stage = "in" | "drop" | "hit" | "reward" | "out" | "black" | "back";

export function PrestigeCutscene({ tickets, gems, commit, onDone }: { tickets: number; gems: number; commit: () => void; onDone: () => void }) {
  const [stage, setStage] = useState<Stage>("in");
  const [count, setCount] = useState(0);
  const committed = useRef(false);
  const jump = useRef<(to: keyof typeof AT) => void>(() => undefined);

  useEffect(() => {
    let timers: number[] = [];
    const schedule = (from: number) => {
      timers.forEach((id) => window.clearTimeout(id));
      const at = (ms: number, f: () => void) => timers.push(window.setTimeout(f, Math.max(0, ms - from)));
      if (from < AT.drop) at(AT.drop, () => setStage("drop"));
      if (from < AT.hit) at(AT.hit, () => { setStage("hit"); sfx("crit"); });
      if (from < AT.reward) at(AT.reward, () => { setStage("reward"); sfx("reward"); });
      at(AT.out, () => setStage("out"));
      at(AT.commit, () => {
        if (!committed.current) {
          committed.current = true;
          commit();
        }
        setStage("black");
      });
      at(AT.in, () => setStage("back"));
      at(AT.done, onDone);
    };
    schedule(0);
    jump.current = (to) => schedule(AT[to]);
    return () => timers.forEach((id) => window.clearTimeout(id));
    // Runs once: the cutscene plays through on its own clock.
  }, []);

  // The tickets count up from the moment they appear.
  useEffect(() => {
    if (stage !== "reward") return;
    let raf = 0;
    const from = performance.now();
    const tick = () => {
      const k = Math.min(1, (performance.now() - from) / COUNT_MS);
      setCount(Math.round(tickets * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage, tickets]);

  const order: Stage[] = ["in", "drop", "hit", "reward", "out", "black", "back"];
  const past = (s: Stage) => order.indexOf(stage) >= order.indexOf(s);
  const skip = () => {
    if (!past("out")) jump.current("out");
  };
  const size = 128 * SCALE;
  return (
    <div className={`nego stage-${stage}`} onClick={skip}>
      {!past("black") && (
        <div className={`nego-stage${past("hit") ? " shake" : ""}`}>
          <div className="nego-paper" style={{ width: size, height: size }}>
            <img src={imageUrl("ui/nego_contract.png")} width={size} height={size} alt="" draggable={false} />
            {past("hit") && (
              <img className="nego-seal-small" src={imageUrl("ui/nego_seal.png")} alt="" draggable={false}
                style={{ left: SEAL_AT.x * SCALE, top: SEAL_AT.y * SCALE, width: 15 * SCALE, height: 15 * SCALE }} />
            )}
            {past("drop") && (
              <img className={`nego-dojang${past("hit") ? " up" : ""}`} src={imageUrl("ui/nego_dojang.png")} alt="" draggable={false}
                style={{ left: SEAL_AT.x * SCALE, top: SEAL_AT.y * SCALE, width: 26 * SCALE, height: 59 * SCALE }} />
            )}
          </div>
          {past("hit") && (
            <div className="nego-stamp">
              <img src={imageUrl("ui/nego_seal.png")} width={116} height={116} alt="" draggable={false} />
              <b>{t("연봉협상 타결!")}</b>
            </div>
          )}
          {past("reward") && (
            <div className="nego-reward">
              <Amount icon="ticket" value={`+${formatCount(count)}`} size={32} />
              {gems > 0 && <Amount icon="gem" value={`+${formatCount(gems)}`} size={32} />}
            </div>
          )}
          {!past("out") && <div className="nego-skip">{t("눌러서 넘기기")}</div>}
        </div>
      )}
      {past("black") && (
        <div className="nego-after">
          <b>{t("1층부터 다시!")}</b>
          <span>{t("피버타임으로 단숨에 올라가요")}</span>
        </div>
      )}
    </div>
  );
}
