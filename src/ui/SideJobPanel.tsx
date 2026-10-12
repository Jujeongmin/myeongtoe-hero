import { useEffect, useRef, useState } from "react";
import { SIDE_JOBS, SIDE_JOB_MAX_LEVEL, sideJobCycle, sideJobIncome, sideJobMilestone, type SideJob } from "../../shared/data/sideJobs";
import { formatBig } from "../../shared/format";
import { sideJobBuy } from "../../shared/prices";
import type { SideJobCount } from "../../shared/actions";
import type { GameState } from "../../shared/state";
import type { GameStore } from "../game/store";
import { t } from "../i18n";
import { Amount } from "./Amount";
import { Icon } from "./Icon";
import { HoldButton } from "./HoldButton";

// How many levels a tap buys: 1, 10 or as many as the gold pays. Kept on the device.
const COUNT_KEY = "myeongtoe-hero:sidejob-count";
const COUNTS: { id: SideJobCount; label: string }[] = [
  { id: 1, label: "1x" },
  { id: 10, label: "10x" },
  { id: "max", label: "최대" },
];

function savedCount(): SideJobCount {
  try {
    const v = localStorage.getItem(COUNT_KEY);
    return v === "10" ? 10 : v === "max" ? "max" : 1;
  } catch {
    return 1;
  }
}

export function SideJobPanel({ state, store }: { state: GameState; store: GameStore }) {
  const [count, setCount] = useState<SideJobCount>(savedCount);
  const pick = (c: SideJobCount) => {
    setCount(c);
    try {
      localStorage.setItem(COUNT_KEY, String(c));
    } catch {
      // No storage: it is 1x again next time.
    }
  };
  return (
    <>
      <div className="tabs buy-count">
        {COUNTS.map((c) => (
          <button key={String(c.id)} className={c.id === count ? "on" : ""} onClick={() => pick(c.id)}>{c.id === "max" ? t(c.label) : c.label}</button>
        ))}
      </div>
      {SIDE_JOBS.map((job) => {
        if (state.run.maxFloor < job.unlockFloor) {
          return (
            <div key={job.id} className="row locked">
              <span className="locked-name"><Icon name="lock" size={16} /> {t(job.name)}</span>
              <span className="sub">{t("{floor}층 도달 시", { floor: job.unlockFloor })}</span>
            </div>
          );
        }
        return <SideJobRow key={job.id} job={job} state={state} store={store} count={count} />;
      })}
    </>
  );
}

// One side job. A level-up is shown on the row itself: the row flashes, "LV UP" pops over the level
// and the pay rise floats up from the income; a bar fills toward the next milestone (pay ×2).
function SideJobRow({ job, state, store, count }: { job: SideJob; state: GameState; store: GameStore; count: SideJobCount }) {
  const own = state.sideJobs[job.id];
  const level = own?.level ?? 0;
  const maxed = level >= SIDE_JOB_MAX_LEVEL;
  const { levels, cost } = sideJobBuy(state, job, level, count);
  const cycle = sideJobCycle(job, level);
  const progress = level > 0 && own ? own.progressSec / cycle : 0;
  const income = sideJobIncome(job, Math.max(1, level));
  const last = useRef({ level, income });
  const [up, setUp] = useState<{ at: number; gain: string; milestone: boolean } | null>(null);
  useEffect(() => {
    const before = last.current;
    if (level > before.level && before.level > 0) {
      const milestone = sideJobMilestone(before.level)?.to !== sideJobMilestone(level)?.to;
      setUp({ at: Date.now(), gain: `+${formatBig(income.sub(before.income))}`, milestone });
    }
    last.current = { level, income };
  }, [level, income]);
  const next = sideJobMilestone(level);
  return (
    <div className={`row levelled${up?.milestone ? " milestone" : ""}`}>
      {up && <i key={up.at} className={`row-flash${up.milestone ? " big" : ""}`} />}
      <span className="icon-box"><Icon name={`job_${job.id}`} /></span>
      <div className="grow">
        <b>{t(job.name)}</b> <span className="lv">Lv{level}{up && <i key={up.at} className="lv-up">{up.milestone ? t("수입 ×2!") : "LV UP"}</i>}</span>
        <div className="sub income">
          <Amount icon="gold" value={formatBig(income)} /> {t("/ {sec}초", { sec: cycle.toFixed(1) })}
          {up && <i key={up.at} className="gain-up">{up.gain}</i>}
        </div>
        <div className="bar">
          <i style={{ width: `${Math.min(1, progress) * 100}%` }} />
        </div>
        {next && level > 0 && (
          <div className="milestone-line">
            <span className="sub">{t("Lv{n} 수입 ×2", { n: next.to })}</span>
            <div className="bar milestone-bar"><i style={{ width: `${((level - next.from) / (next.to - next.from)) * 100}%` }} /></div>
          </div>
        )}
      </div>
      <HoldButton data-tut={`job-${job.id}`} className={maxed || state.gold.lt(cost) ? "poor" : "hot"} disabled={maxed || state.gold.lt(cost)} onFire={() => store.do({ k: "levelSideJob", id: job.id, count })}>
        {maxed ? t("최대") : level === 0 && levels === 1 ? t("시작") : levels > 1 ? `+${levels}` : t("레벨업")}<br /><Amount icon="gold" value={formatBig(cost)} />
      </HoldButton>
    </div>
  );
}
