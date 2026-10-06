# 4단계: 영구 성장 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 영구 성장 축을 넣는다. 업무 장비 Lv5 상한, 동료 7종, 동료 상자, 퇴직 기념품 8종, 아파트, 정장 6부위 × 6세트, 사무용품 4부위 17등급이 들어간다.

**Architecture:** 영구 성장 효과를 `shared/mods.ts`의 `mods(state)` 한 곳에서 `Mods`로 합친다. 자격증, 동료, 기념품, 아파트, 정장, 사무용품의 효과가 모두 여기로 모인다. `heroPower`, `offlineCapSec`, `settle`은 `Mods`만 본다. 동료 효과 중 "몬스터 체력 깎기"와 "초당 체력 % 감소"는 `Power`에 `hpMult`, `drainPerSec`을 더해서 닫힌 공식으로 정산한다(`처치 시간 = 1 / (dps/hp + drain)`). 랜덤 효과(최대리 0~30%, 공주임 랜덤 버프, 오사원 응시권 확률)는 기대값으로 계산한다. 응시권 확률 드롭은 소수점 이월(`ticketCarry`)로 쪼개도 결과가 같게 한다.

**Tech Stack:** 1~3단계와 같음

## Global Constraints

- 구조 변경은 구현 전에 사용자 승인을 받는다(2026-10-06 지시). 이 계획의 구조는 아래 "사용자 결정"으로 승인받았다.
- 규칙은 `shared/`에만 둔다. 수치는 1차 값이고 8단계 시뮬레이터로 조정한다(상수 이름 유지).
- 세이브 버전 3, 2→3 마이그레이션. 기존 업무 장비 레벨이 5를 넘으면 5로 맞춘다.
- 커밋 직전 `npm test`, `npm run typecheck`, `npm run server:test`. 태스크마다 `develop` 푸시(`$TEMP/ship.sh` 사용).
- 상품권(🎟)은 5단계(지하주차장)부터 들어온다. 이 단계의 상품권 소비 기능은 로컬 세이브를 고쳐서 시험한다.

**사용자 결정 (2026-10-06):**
- 피해 없는 전투를 유지한다.
- 업무 장비는 레벨 최대 5, Lv5가 되어야 다음 장비를 살 수 있다.
- 동료 구조: 층 도달 자동 획득, 패시브, 보석 레벨업, 2000층마다 각성(최대 10단계). 동료 목록은 아래 표대로.
- 동료 상자: 상품권 70개, 랜덤 동료 +1레벨. 동료 승급은 생략.
- 기념품 구조: 층 도달 자동 획득, 보석 레벨업. 기념품 목록은 아래 표대로. 채광 관련(얼음팩)은 3차.
- 사무용품 구조: 4부위를 처음부터 보유, 상품권으로 1→17등급 업그레이드만(뽑기 없음, 1→2등급 200개).
- 공주임의 버프는 자동 발동(평균 효과).

**사용자 결정 2차 (화면 구조, 2026-10-06):**
- 화면 구조: 하단 메뉴 6개(부업, 장비, 동료, 자격증, 상점, 던전), 아직 안 열린 메뉴는 잠금 표시. 이직은 전투 화면 왼쪽 아래 버튼. 정장, 아파트, 기념품, 사무용품은 전투 화면 오른쪽 아이콘으로 여는 창. 재화 줄은 전투 화면 바로 아래.
- 장비 목록은 30개 전부 표시(Lv x/5, ATK, 버튼).
- 업무 장비 수치: 공격력 50에서 ×3씩, 가격 600에서 ×6씩. 몬스터 체력 기본값도 ×5(20 → 100)로 올려 초반 속도를 유지한다.
- 골드 스탯 강화(3단계의 "강화" 탭)를 뺀다. 하단 메뉴에 두지 않고, 공속, 치명타는 자격증에서 얻는다.
- 정장은 부위별로 하나씩 착용하고, 착용한 것만 효과(세트 보너스는 같은 세트 6부위를 모두 착용했을 때). 착용 정보(`wear`)는 7단계에서 캐릭터 외형 레이어로 그린다. 손에 든 업무 장비도 외형 레이어다.
- 단계 미션은 5단계에 넣는다.

**동료 7종**

| id | 이름 | 획득 층 | 효과 (Lv1) | 레벨당 | 각성 효과 |
|---|---|---|---|---|---|
| p_intern | 김인턴 | 100 | 2.5초마다 공격력 100% 추가 공격 | +10% | 추가 공격 데미지 2배 |
| p_jumim | 박주임 | 300 | 20초마다 가장 비싼 부업 수입 1회 지급 | 주기 −0.5초(최소 5초) | 그 지급 2배 |
| p_daeri | 최대리 | 600 | 몬스터 등장 시 체력 0~30% 깎음(평균) | 최대치 +1%p(최대 60%) | 최소치 1% |
| p_gongju | 공주임 | 900 | 5초마다 2초 랜덤 버프(데미지/공속/골드 2배 중 하나) | 지속 +0.1초(최대 5초) | 이직 보상 계산 층수 +10% |
| p_oh | 막내 오사원 | 1100 | 처치 시 0.5% 확률로 응시권 | +0.05%p | 확률 ×1.1 |
| p_hong | 홍과장 | 4500 | 2초마다 적 최대 체력 1% 감소 | +0.05%p | 2초마다 2번 |
| p_minam | 꽃미남 실장 | 6500 | 몬스터 등장 시 체력 4% 감소 | +0.2%p(최대 50%) | 모든 데미지 2배 |

각성 단계 = `min(10, floor(최고 층 / 2000))`. 1단계 이상이면 각성 효과가 켜지고, 기본 효과가 단계당 +10%다.

**기념품 8종**

| id | 이름 | 획득 층 | 레벨당 효과 |
|---|---|---|---|
| r_badge | 근속 25년 금배지 | 1000 | 현재 층이 3000층 이하면 데미지 +250% |
| r_plaque | 공로패 | 2000 | 골드 +50% |
| r_watch | 명품 손목시계 | 3000 | 공격 속도 +5% |
| r_cards | 명함 뭉치 | 4000 | 분신이 공격력 40%로 함께 공격 |
| r_pin | 부장님 넥타이핀 | 5000 | 공주임 버프 효과 +30% |
| r_stamp | 대형 결재 도장 | 6000 | 김인턴 추가 공격 +1% |
| r_pas | 파스 | 8000 | 3차 자격증 효과 +20% |
| r_fan | 부채 | 9000 | 아파트 평수 +2평으로 계산 |

---

### Task 1: 업무 장비 정리 — 레벨 상한, 장비 수치, 골드 강화 제거

**Files:**
- Modify: `shared/data/gear.ts`, `shared/data/floors.ts`, `shared/actions.ts`, `shared/stats.ts`
- Delete: `shared/data/stats.ts`, `src/ui/StatPanel.tsx`
- Tests: `shared/actions.test.ts`, `shared/sync.test.ts`, `shared/settle.test.ts`, `shared/power.test.ts`
- UI 임시 수정: `src/ui/GearPanel.tsx`, `src/App.tsx`(강화 탭 제거; 전체 화면 개편은 Task 7)

**Interfaces:**
- Produces: `GEAR_MAX_LEVEL = 5`. `levelGear`는 Lv5에서 `max`, `buyGear`는 현재 장비가 Lv5가 아니면 `locked`.
- 수치: `GEAR_ATK_BASE = 50`, `GEAR_ATK_GROWTH = 3`, `GEAR_PRICE_BASE = 100`, `GEAR_PRICE_GROWTH = 6`(1단계 600, 2단계 3600, 3단계 21600), `HP_BASE = 100`.
- 없어지는 것: `Intent`의 `levelStat`, `shared/data/stats.ts`, `heroPower`/`heroAtk`의 스탯 항. (`GameState.stats`는 Task 2 마이그레이션에서 지운다.)

- [ ] **Step 1: 테스트 수정**

`shared/actions.test.ts`:
- `./data/stats` import와 `describe("stats", …)` 블록을 지운다.
- `readIntent` 테스트의 `levelStat` 두 줄을 지우고 `expect(readIntent({ k: "levelStat", id: "atk" })).toBeNull();`을 넣는다.
- prestige 테스트의 `s.stats = …`와 `expect(after.stats)…` 줄을 지운다.
- gear: import에 `GEAR_MAX_LEVEL`, `gearAtk` 추가. "buying the next tier resets the level"의 상태와 거절 검사 상태를 모두 `level: GEAR_MAX_LEVEL`로 바꾼다. 추가:
```ts
  test("levels stop at 5, and the next tier opens only then", () => {
    expect(codeOf({ ...rich(), gear: { tier: 0, level: GEAR_MAX_LEVEL } }, { k: "levelGear" })).toBe("max");
    expect(codeOf({ ...rich(), gear: { tier: 0, level: GEAR_MAX_LEVEL - 1 } }, { k: "buyGear" })).toBe("locked");
  });

  test("gear numbers: ATK 50 ×3, price 600 ×6", () => {
    expect(gearAtk(0, 0).toNumber()).toBeCloseTo(50, 9);
    expect(gearAtk(1, 0).toNumber()).toBeCloseTo(150, 9);
    expect(gearPrice(1).toNumber()).toBeCloseTo(600, 6);
    expect(gearPrice(2).toNumber()).toBeCloseTo(3600, 6);
  });
```

`shared/sync.test.ts`의 "drops intents past the per-sync limit":
```ts
    const many = Array.from({ length: MAX_INTENTS_PER_SYNC + 2 }, () => ({ k: "levelSideJob", id: "j00" }));
    const r = syncSave(save, many, 0);
    expect(r.save.sideJobs.j00.level).toBe(MAX_INTENTS_PER_SYNC);
```

`shared/power.test.ts`: stats 관련 import와 테스트를 지우고, "a fresh Park" 기대값을 `50 * 2 * 1.025`로.

`shared/settle.test.ts`: 기본 체력이 5배이므로 DPS도 5배로. `Big.of(20)` → `Big.of(100)`(모든 곳), `Big.of(37)` → `Big.of(185)`, heroDps 기대값 `10 * 2 * 1.025` → `50 * 2 * 1.025`, 주석 숫자도 맞춘다.

- [ ] **Step 2: 실패 확인** — `npx vitest run shared` → FAIL

- [ ] **Step 3: 구현**

`shared/data/gear.ts`: `GEAR_MAX_LEVEL = 5` 추가, `GEAR_ATK_BASE = 50`, `GEAR_ATK_GROWTH = 3`, `GEAR_PRICE_BASE = 100`, `GEAR_PRICE_GROWTH = 6`. 주석: 업무 장비 수치(볼펜 ATK 50, 이후 ×3, 두 번째 600골드, 이후 ×6).

`shared/data/floors.ts`: `HP_BASE = 100`(장비 공격력 기본값을 5배 올린 만큼).

`shared/actions.ts`: `levelStat` 제거, `levelGear` 맨 앞 `if (s.gear.level >= GEAR_MAX_LEVEL) throw new RuleError("max");`, `buyGear`의 `max` 검사 다음 `if (s.gear.level < GEAR_MAX_LEVEL) throw new RuleError("locked");`, `prestige`의 `s.stats = …` 제거.

`shared/stats.ts`: `./data/stats` import 제거.
```ts
export function heroAtk(s: GameState): Big {
  const b = certBonuses(s.certs);
  return gearAtk(s.gear.tier, s.gear.level).mulN(1 + b.atk);
}
```
`heroPower`: `const aspd = HERO_ASPD * (1 + b.aspd) * skillProduct(s, "aspd");`, `const crit = HERO_CRIT_CHANCE;`, `const critBonus = HERO_CRIT_BONUS + b.critDmg;`

`src/App.tsx`에서 강화 탭과 `StatPanel` import 제거. `src/ui/GearPanel.tsx`는 Lv5 규칙만 반영(레벨업 `최대`, 다음 장비는 Lv5에서만, `Lv{level}/5`).

- [ ] **Step 4: 통과 확인 후 배포**
```bash
git rm -q shared/data/stats.ts src/ui/StatPanel.tsx
bash "$TEMP/ship.sh" "feat: gear level cap, gear numbers, no gold stat upgrades" shared src
```

---

### Task 2: 세이브 v3

**Files:**
- Modify: `shared/state.ts`, `shared/state.test.ts`

**Interfaces:**
- Produces: `SAVE_VERSION = 3`. `GameState`/`SaveData`에 추가:
  - `coupons: number` (🎟 상품권)
  - `ticketCarry: number` (0 이상 1 미만, 응시권 확률 드롭 이월)
  - `pets: Record<string, number>` (동료 레벨. 없으면 1)
  - `relics: Record<string, number>` (기념품 레벨. 없으면 1)
  - `apartment: number` (평)
  - `suits: string[]` (보유 정장 부위 id)
  - `office: OfficeGrades` = `{ keyboard: number; mouse: number; chair: number; monitor: number }` (1~17)
  - `wear: Record<string, string>` (정장 부위 → 착용한 아이템 id)
  - 지우는 필드: `stats` (Task 1에서 골드 강화를 뺐다)
- `id` 검증은 Task 3~5에서 각 표가 생기면 붙인다. 이 태스크에서는 `pets`/`relics`/`suits`의 키를 형식(`p_`/`r_`/`s`로 시작, 32자 이하)으로만 거른다.

- [ ] **Step 1: 실패하는 테스트**

`shared/state.test.ts`:
- 첫 테스트에 추가:
```ts
    expect(s.coupons).toBe(0);
    expect(s.ticketCarry).toBe(0);
    expect(s.pets).toEqual({});
    expect(s.relics).toEqual({});
    expect(s.apartment).toBe(0);
    expect(s.suits).toEqual([]);
    expect(s.office).toEqual({ keyboard: 1, mouse: 1, chair: 1, monitor: 1 });
    expect(s.wear).toEqual({});
    expect("stats" in s).toBe(false);
```
  같은 테스트와 "a version 1 save migrates" 테스트의 `expect(s.stats)…` 줄은 지운다.
- 추가:
```ts
  test("a version 2 save migrates, and gear above level 5 comes down to 5", () => {
    const v2 = { ...toSave(newState(0)), v: 2, gear: { tier: 3, level: 12 } } as Record<string, unknown>;
    for (const k of ["coupons", "ticketCarry", "pets", "relics", "apartment", "suits", "office", "wear"]) delete v2[k];
    v2.stats = { atk: 3, crit: 0, critDmg: 0, aspd: 0 };
    const s = fromSave(v2);
    expect(s.v).toBe(SAVE_VERSION);
    expect(s.gear).toEqual({ tier: 3, level: 5 });
    expect(s.office).toEqual({ keyboard: 1, mouse: 1, chair: 1, monitor: 1 });
    expect(s.suits).toEqual([]);
  });

  test("office grades stay within 1..17 and suits are unique strings", () => {
    const save = toSave(newState(0)) as unknown as Record<string, unknown>;
    save.office = { keyboard: 40, mouse: 0, chair: 3, monitor: "x" };
    save.suits = ["s1_hair", "s1_hair", 5, "s2_suit"];
    const s = fromSave(save);
    expect(s.office).toEqual({ keyboard: 17, mouse: 1, chair: 3, monitor: 1 });
    expect(s.suits).toEqual(["s1_hair", "s2_suit"]);
  });
```
- "a version 1 save migrates" 테스트는 그대로 통과해야 한다(1→2→3 연쇄).

- [ ] **Step 2: 실패 확인** — `npx vitest run shared/state.test.ts` → FAIL

- [ ] **Step 3: 구현**

`shared/state.ts`:
- `SAVE_VERSION = 3`
- 인터페이스:
```ts
export interface OfficeGrades {
  keyboard: number;
  mouse: number;
  chair: number;
  monitor: number;
}
export const OFFICE_MAX_GRADE = 17;
```
- `GameState`/`SaveData`에 필드 7개 추가(위 Interfaces).
- `MIGRATIONS[2]`:
```ts
  // v3: permanent growth (pets, relics, apartment, suits, office) and the coupon currency. Gear above
  // level 5 comes down to 5 (the gear level cap).
  2: (save) => {
    const gear = obj(save.gear);
    return {
      ...save, v: 3, coupons: 0, ticketCarry: 0, pets: {}, relics: {}, apartment: 0, suits: [], wear: {},
      office: { keyboard: 1, mouse: 1, chair: 1, monitor: 1 }, stats: undefined,
      gear: { ...gear, level: Math.min(int(gear.level, 0, 0), GEAR_MAX_LEVEL) },
    };
  },
```
  (`MIGRATIONS`를 helper 함수들 아래로 옮기거나, helper를 위로 올려 정의 순서 문제가 없게 한다. `import { GEAR_MAX_LEVEL, GEAR_TIERS } from "./data/gear";`)
- `StatLevels`와 `stats` 필드를 `GameState`, `SaveData`, `newState`, `cloneState`, `toSave`, `fromSave`에서 지운다.
- `newState`에 `coupons: 0, ticketCarry: 0, pets: {}, relics: {}, apartment: 0, suits: [], wear: {}, office: { keyboard: 1, mouse: 1, chair: 1, monitor: 1 }`
- `cloneState`에 `pets: { ...s.pets }, relics: { ...s.relics }, suits: [...s.suits], wear: { ...s.wear }, office: { ...s.office }`
- `toSave`에 8개 필드
- `fromSave`:
```ts
  const grade = (x: unknown) => Math.min(OFFICE_MAX_GRADE, int(x, 1, 1));
  const office = obj(data.office);
  const levels = (x: unknown, prefix: string) => {
    const out: Record<string, number> = {};
    for (const [id, lv] of Object.entries(obj(x))) {
      if (id.startsWith(prefix) && id.length <= 32 && int(lv, 1, 0) >= 1) out[id] = lv as number;
    }
    return out;
  };
  const suits = Array.isArray(data.suits)
    ? [...new Set(data.suits.filter((x): x is string => typeof x === "string" && x.startsWith("s") && x.length <= 32))]
    : [];
```
  반환에:
```ts
    coupons: int(data.coupons, 0, 0),
    ticketCarry: typeof data.ticketCarry === "number" && data.ticketCarry >= 0 && data.ticketCarry < 1 ? data.ticketCarry : 0,
    pets: levels(data.pets, "p_"),
    relics: levels(data.relics, "r_"),
    apartment: int(data.apartment, 0, 0),
    suits,
    office: { keyboard: grade(office.keyboard), mouse: grade(office.mouse), chair: grade(office.chair), monitor: grade(office.monitor) },
    wear: Object.fromEntries(
      Object.entries(obj(data.wear)).filter(([part, id]) => typeof id === "string" && suits.includes(id) && id.endsWith(`_${part}`)),
    ) as Record<string, string>,
```
  (착용은 보유한 아이템만, 그 부위의 아이템만 남는다.)
  그리고 `gear.level`도 `Math.min(int(gear.level, 0, 0), GEAR_MAX_LEVEL)`로 읽는다.

- [ ] **Step 4: 통과 확인 후 배포**
```bash
bash "$TEMP/ship.sh" "feat: save v3 for permanent growth" shared
```

---

### Task 3: 동료 7종과 `Mods`

**Files:**
- Create: `shared/data/pets.ts`, `shared/mods.ts`, `shared/pets.test.ts`
- Modify: `shared/stats.ts`, `shared/settle.ts`, `shared/settle.test.ts`, `shared/data/certs.ts`

**Interfaces:**
- Produces:
  - `interface PetDef { id: string; name: string; unlockFloor: number; text: string }`, `PETS`(7개), `findPet`, `petsUnlocked(bestFloor)`, `petLevel(s, id)`, `petLevelCost(level): number`(보석), `awakenStage(bestFloor): number`, `PET_BOX_COUPONS = 70`
  - `interface Mods { dmgMult; aspdMult; critDmgAdd; bossMult; goldMult; sideJobMult; prestigeBonus; prestigeFloorMult; offlineSec; hpMult; drainPerSec; extraHitPerSec; sideJobPaySec; sideJobPayMult; ticketPerKill }` (모두 number)
  - `mods(s: GameState): Mods`
  - `Power`에 `hpMult: number; drainPerSec: number` 추가
  - `certBonuses(certs, tier3Mult = 1)`
  - `settleBattle` 결과에 `kills: number` 추가
  - `targetSec(floor, power) = 1 / (dps / (hp × hpMult) + drainPerSec)`

- [ ] **Step 1: 실패하는 테스트**

`shared/pets.test.ts`:
```ts
import { describe, expect, test } from "vitest";
import { Big } from "./big";
import { BOSS_LIMIT_SEC } from "./data/floors";
import { PETS, awakenStage, petLevelCost, petsUnlocked } from "./data/pets";
import { SIDE_JOBS } from "./data/sideJobs";
import { mods } from "./mods";
import { settle, settleBattle, targetSec } from "./settle";
import { newState } from "./state";
import { heroPower, type Power } from "./stats";

const at = (bestFloor: number) => ({ ...newState(0), bestFloor });

describe("pet table", () => {
  test("7 pets unlocked by best floor, in order", () => {
    expect(PETS.map((p) => p.unlockFloor)).toEqual([100, 300, 600, 900, 1100, 4500, 6500]);
    expect(petsUnlocked(99)).toEqual([]);
    expect(petsUnlocked(600).map((p) => p.id)).toEqual(["p_intern", "p_jumim", "p_daeri"]);
    expect(petLevelCost(2)).toBeGreaterThan(petLevelCost(1));
  });

  test("awakening every 2000 floors, up to 10", () => {
    expect(awakenStage(1999)).toBe(0);
    expect(awakenStage(2000)).toBe(1);
    expect(awakenStage(99_999)).toBe(10);
  });
});

describe("pet effects", () => {
  test("none before floor 100", () => {
    const m = mods(at(1));
    expect(m.extraHitPerSec).toBe(0);
    expect(m.hpMult).toBe(1);
    expect(m.ticketPerKill).toBe(0);
  });

  test("김인턴 adds an extra hit of 100% attack every 2.5 s", () => {
    expect(mods(at(100)).extraHitPerSec).toBeCloseTo(0.4, 12);
    const s = at(100);
    s.pets.p_intern = 11;
    expect(mods(s).extraHitPerSec).toBeCloseTo(0.4 * 2, 12);
  });

  test("최대리 and 꽃미남 cut monster health, 홍과장 drains it", () => {
    expect(mods(at(600)).hpMult).toBeCloseTo(0.85, 12);
    expect(mods(at(6500)).hpMult).toBeLessThan(0.85 * 0.96 + 1e-9);
    expect(mods(at(4500)).drainPerSec).toBeGreaterThan(0);
  });

  test("a drain speeds kills: time = 1 / (dps/hp + drain)", () => {
    const p: Power = { dps: Big.of(1), bossDps: Big.of(1), bossLimitSec: BOSS_LIMIT_SEC, goldMult: 1, hpMult: 1, drainPerSec: 0.1 };
    // floor 1: 20 hp at 1 dps → 1 / (0.05 + 0.1)
    expect(targetSec(1, p)).toBeCloseTo(1 / 0.15, 9);
  });

  test("막내 오사원's ticket drops carry fractions across settles", () => {
    const s = at(1100);
    s.gear = { tier: 10, level: 0 };
    const once = settle(s, 3_600_000);
    let split = s;
    for (let t = 60_000; t <= 3_600_000; t += 60_000) split = settle(split, t);
    expect(split.tickets).toBe(once.tickets);
    expect(once.tickets).toBeGreaterThan(0);
  });

  test("박주임 pays the dearest side job every 20 s", () => {
    const s = at(300);
    s.sideJobs[SIDE_JOBS[0].id] = { level: 1, progressSec: 0, running: false };
    const quiet = { ...at(1), sideJobs: s.sideJobs };
    expect(settle(s, 200_000).gold.cmp(settle(quiet, 200_000).gold)).toBe(1);
  });

  test("they reach Park's power", () => {
    expect(heroPower(at(100)).dps.cmp(heroPower(at(1)).dps)).toBe(1);
    expect(settleBattle(newState(0).run, heroPower(at(1)), 10).kills).toBeGreaterThan(0);
  });
});
```

`shared/settle.test.ts`의 helper `P`에 기본값 두 개를 넣는다:
```ts
const P = (dps: Big, extra: Partial<Power> = {}): Power => ({ dps, bossDps: dps, bossLimitSec: BOSS_LIMIT_SEC, goldMult: 1, hpMult: 1, drainPerSec: 0, ...extra });
```

- [ ] **Step 2: 실패 확인** — `npx vitest run shared/pets.test.ts` → FAIL (`./data/pets` 없음)

- [ ] **Step 3: 구현**

`shared/data/pets.ts`:
```ts
// 동료: each joins on its own once the best floor reaches it, works passively,
// levels with 보석, and awakens every 2000 floors (up to 10 stages). The 동료 상자
// gives a random unlocked one a level for 상품권.
export interface PetDef {
  id: string;
  name: string;
  unlockFloor: number;
  text: string;
}

export const PETS: readonly PetDef[] = [
  { id: "p_intern", name: "김인턴", unlockFloor: 100, text: "2.5초마다 공격력 100% 추가 공격" },
  { id: "p_jumim", name: "박주임", unlockFloor: 300, text: "20초마다 가장 비싼 부업 수입 지급" },
  { id: "p_daeri", name: "최대리", unlockFloor: 600, text: "몬스터 등장 시 체력 0~30% 깎기" },
  { id: "p_gongju", name: "공주임", unlockFloor: 900, text: "5초마다 2초 랜덤 버프" },
  { id: "p_oh", name: "막내 오사원", unlockFloor: 1100, text: "처치 시 확률로 응시권" },
  { id: "p_hong", name: "홍과장", unlockFloor: 4500, text: "2초마다 적 최대 체력 1% 감소" },
  { id: "p_minam", name: "꽃미남 실장", unlockFloor: 6500, text: "몬스터 등장 시 체력 4% 감소" },
];

export const PET_BOX_COUPONS = 70;
export const AWAKEN_EVERY = 2000;
export const AWAKEN_MAX = 10;

const BY_ID = new Map(PETS.map((p) => [p.id, p]));

export function findPet(id: string): PetDef | undefined {
  return BY_ID.get(id);
}

export function petsUnlocked(bestFloor: number): PetDef[] {
  return PETS.filter((p) => bestFloor >= p.unlockFloor);
}

export function awakenStage(bestFloor: number): number {
  return Math.min(AWAKEN_MAX, Math.floor(bestFloor / AWAKEN_EVERY));
}

// The 보석 cost of going from `level` to `level + 1`.
export function petLevelCost(level: number): number {
  return Math.ceil(10 * 1.18 ** (level - 1));
}
```

`shared/mods.ts`:
```ts
import { certBonuses } from "./data/certs";
import { awakenStage, petsUnlocked } from "./data/pets";
import type { GameState } from "./state";

// Every permanent effect in one place: certificates, pets (and later relics, the apartment, suits
// and office gear). heroPower, settle and the offline cap read only this.
export interface Mods {
  dmgMult: number;
  aspdMult: number;
  critDmgAdd: number;
  bossMult: number;
  goldMult: number;
  sideJobMult: number;
  prestigeBonus: number;
  prestigeFloorMult: number;
  offlineSec: number;
  hpMult: number;
  drainPerSec: number;
  extraHitPerSec: number;
  sideJobPaySec: number;
  sideJobPayMult: number;
  ticketPerKill: number;
}

export function petLevel(s: GameState, id: string): number {
  return s.pets[id] ?? 1;
}

export function mods(s: GameState): Mods {
  const c = certBonuses(s.certs);
  const m: Mods = {
    dmgMult: 1 + c.atk,
    aspdMult: 1 + c.aspd,
    critDmgAdd: c.critDmg,
    bossMult: 1 + c.boss,
    goldMult: 1 + c.gold,
    sideJobMult: 1 + c.sideJob,
    prestigeBonus: c.prestige,
    prestigeFloorMult: 1,
    offlineSec: c.offlineSec,
    hpMult: 1,
    drainPerSec: 0,
    extraHitPerSec: 0,
    sideJobPaySec: 0,
    sideJobPayMult: 1,
    ticketPerKill: 0,
  };
  applyPets(s, m);
  return m;
}

function applyPets(s: GameState, m: Mods): void {
  const stage = awakenStage(s.bestFloor);
  const awake = stage >= 1;
  const boost = 1 + 0.1 * stage;
  for (const pet of petsUnlocked(s.bestFloor)) {
    const lv = petLevel(s, pet.id);
    switch (pet.id) {
      case "p_intern":
        m.extraHitPerSec += (1 / 2.5) * (1 + 0.1 * (lv - 1)) * boost * (awake ? 2 : 1);
        break;
      case "p_jumim":
        m.sideJobPaySec = Math.max(5, 20 - 0.5 * (lv - 1));
        m.sideJobPayMult = boost * (awake ? 2 : 1);
        break;
      case "p_daeri": {
        const max = Math.min(0.6, 0.3 + 0.01 * (lv - 1));
        const min = awake ? 0.01 : 0;
        m.hpMult *= 1 - Math.min(0.9, ((min + max) / 2) * boost);
        break;
      }
      case "p_gongju": {
        const uptime = Math.min(5, 2 + 0.1 * (lv - 1)) / 5;
        const per = 1 + ((2 * boost - 1) * uptime) / 3;
        m.dmgMult *= per;
        m.aspdMult *= per;
        m.goldMult *= per;
        if (awake) m.prestigeFloorMult *= 1.1;
        break;
      }
      case "p_oh":
        m.ticketPerKill += (0.005 + 0.0005 * (lv - 1)) * boost * (awake ? 1.1 : 1);
        break;
      case "p_hong":
        m.drainPerSec += ((0.01 + 0.0005 * (lv - 1)) / 2) * boost * (awake ? 2 : 1);
        break;
      case "p_minam":
        m.hpMult *= 1 - Math.min(0.5, (0.04 + 0.002 * (lv - 1)) * boost);
        if (awake) m.dmgMult *= 2;
        break;
    }
  }
}
```
(`petLevel`은 `mods.ts`에 둔다. Interfaces 목록의 `petLevel(s, id)`가 이것이다.)

`shared/data/certs.ts`의 `certBonuses`에 두 번째 인자 추가:
```ts
export function certBonuses(certs: Record<string, number>, tier3Mult = 1): Bonuses {
```
그리고 `const add = def.perLevel * level * (def.tier === 3 ? tier3Mult : 1);`

`shared/stats.ts` 전체를 `Mods` 기반으로:
```ts
import type { Big } from "./big";
import { BOSS_LIMIT_SEC } from "./data/floors";
import { gearAtk } from "./data/gear";
import { skillFactor, skillsUnlocked } from "./data/skills";
import { STAT_ASPD_PER_LEVEL, STAT_ATK_PER_LEVEL, STAT_CRITDMG_PER_LEVEL, STAT_CRIT_PER_LEVEL } from "./data/stats";
import { mods } from "./mods";
import { OFFLINE_CAP_SEC, type GameState } from "./state";

export const HERO_ASPD = 2;
export const HERO_CRIT_CHANCE = 0.05;
export const HERO_CRIT_BONUS = 0.5;

// Everything settle needs to know about how strong Park is right now. Expected values only (crits,
// skills and random pet effects averaged in), so the server and every client agree.
export interface Power {
  dps: Big;
  bossDps: Big;
  bossLimitSec: number;
  goldMult: number;
  hpMult: number;
  drainPerSec: number;
}

function skillProduct(s: GameState, kind: string): number {
  return skillsUnlocked(s.bestFloor)
    .filter((k) => k.kind === kind)
    .reduce((m, k) => m * skillFactor(k), 1);
}

export function heroAtk(s: GameState): Big {
  return gearAtk(s.gear.tier, s.gear.level).mulN((1 + STAT_ATK_PER_LEVEL * s.stats.atk) * mods(s).dmgMult);
}

export function heroPower(s: GameState): Power {
  const m = mods(s);
  const atk = heroAtk(s);
  const aspd = HERO_ASPD * (1 + STAT_ASPD_PER_LEVEL * s.stats.aspd) * m.aspdMult * skillProduct(s, "aspd");
  const crit = Math.min(1, HERO_CRIT_CHANCE + STAT_CRIT_PER_LEVEL * s.stats.crit);
  const critBonus = HERO_CRIT_BONUS + STAT_CRITDMG_PER_LEVEL * s.stats.critDmg + m.critDmgAdd;
  const hits = atk.mulN(aspd * (1 + crit * critBonus) * skillProduct(s, "damage"));
  const dps = m.extraHitPerSec > 0 ? hits.add(atk.mulN(m.extraHitPerSec)) : hits;
  const bossTime = skillsUnlocked(s.bestFloor)
    .filter((k) => k.kind === "bossTime")
    .reduce((sum, k) => sum + k.value, 0);
  return {
    dps,
    bossDps: dps.mulN(m.bossMult),
    bossLimitSec: BOSS_LIMIT_SEC + bossTime,
    goldMult: skillProduct(s, "gold") * m.goldMult,
    hpMult: m.hpMult,
    drainPerSec: m.drainPerSec,
  };
}

export function heroDps(s: GameState): Big {
  return heroPower(s).dps;
}

export function offlineCapSec(s: GameState): number {
  return OFFLINE_CAP_SEC + mods(s).offlineSec;
}

export function sideJobMult(s: GameState): number {
  return mods(s).sideJobMult;
}
```

`shared/settle.ts`:
- `targetSec`:
```ts
export function targetSec(floor: number, power: Power): number {
  const hp = targetHp(floor).mulN(power.hpMult);
  const dps = isBossFloor(floor) ? power.bossDps : power.dps;
  const rate = (hp.isZero() ? 0 : dps.div(hp).toNumber()) + power.drainPerSec;
  return rate > 0 ? 1 / rate : Number.POSITIVE_INFINITY;
}
```
- `settleBattle`: 결과에 `kills` 추가. 처치할 때마다(일반, 보스, 파밍 모두) 센다. 파밍은 `kills += n`.
- `settle`:
```ts
export function settle(state: GameState, now: number): GameState {
  if (now <= state.lastTick) return state;
  const dt = Math.min(offlineCapSec(state), (now - state.lastTick) / 1000);
  const next = cloneState(state);
  const m = mods(next);
  const battle = settleBattle(next.run, heroPower(next), dt);
  const jobs = settleSideJobs(next.sideJobs, dt, next.flags.sideJobAuto, m.sideJobMult);
  const best = Math.max(next.bestFloor, battle.run.maxFloor);
  const drops = next.ticketCarry + battle.kills * m.ticketPerKill;
  next.gems += firstClearGems(next.bestFloor, best);
  next.lastTick = now;
  next.run = battle.run;
  next.bestFloor = best;
  next.tickets += battle.tickets + Math.floor(drops);
  next.ticketCarry = drops - Math.floor(drops);
  next.sideJobs = jobs.sideJobs;
  next.gold = next.gold.add(battle.gold).add(jobs.gold).add(paidBySideJobPet(next, m, dt));
  return next;
}

// 박주임: the dearest owned side job's income, once every sideJobPaySec seconds (counted
// continuously, so splitting the time changes nothing).
function paidBySideJobPet(s: GameState, m: Mods, dt: number): Big {
  if (m.sideJobPaySec <= 0) return Big.ZERO;
  let best = Big.ZERO;
  for (const [id, own] of Object.entries(s.sideJobs)) {
    const job = findSideJob(id);
    if (!job || own.level === 0) continue;
    const income = sideJobIncome(job, own.level);
    if (income.cmp(best) > 0) best = income;
  }
  return best.mulN((dt / m.sideJobPaySec) * m.sideJobPayMult * m.sideJobMult);
}
```
  import에 `import { mods, type Mods } from "./mods";` 추가. `heroPower`, `offlineCapSec` import는 유지하고 `sideJobMult` import는 지운다.

순환 import 주의: `mods.ts` → `state.ts`(타입만), `data/*`. `stats.ts` → `mods.ts`. `settle.ts` → `mods.ts`, `stats.ts`. 순환 없음.

- [ ] **Step 4: 통과 확인 후 배포**
```bash
bash "$TEMP/ship.sh" "feat: seven pets as passive companions, gathered in Mods" shared
```

---

### Task 4: 퇴직 기념품 8종

**Files:**
- Create: `shared/data/relics.ts`, `shared/relics.test.ts`
- Modify: `shared/mods.ts`

**Interfaces:**
- Produces: `interface RelicDef { id; name; unlockFloor; text }`, `RELICS`(8개), `findRelic`, `relicsUnlocked(bestFloor)`, `relicLevel(s, id)`, `relicLevelCost(level): number`(보석)
- `mods`가 기념품 효과를 적용한다. `r_pin`(공주임 버프 +30%/Lv)과 `r_stamp`(김인턴 +1%/Lv)는 동료 계산 안에서 쓰므로, `applyPets`보다 먼저 기념품 레벨을 읽는다. `r_pas`는 `certBonuses(s.certs, 1 + 0.2 × Lv)`로 넘긴다. `r_fan`은 Task 5의 아파트 계산에서 쓴다.

- [ ] **Step 1: 실패하는 테스트**

`shared/relics.test.ts`:
```ts
import { describe, expect, test } from "vitest";
import { RELICS, relicLevelCost, relicsUnlocked } from "./data/relics";
import { mods } from "./mods";
import { newState } from "./state";

const at = (bestFloor: number, floor = 1) => {
  const s = newState(0);
  s.bestFloor = bestFloor;
  s.run = { ...s.run, floor, maxFloor: floor };
  return s;
};

describe("relics", () => {
  test("8 relics from floor 1000 to 9000 (no 7000: mining comes with stocks)", () => {
    expect(RELICS.map((r) => r.unlockFloor)).toEqual([1000, 2000, 3000, 4000, 5000, 6000, 8000, 9000]);
    expect(relicsUnlocked(2500).map((r) => r.id)).toEqual(["r_badge", "r_plaque"]);
    expect(relicLevelCost(3)).toBeGreaterThan(relicLevelCost(2));
  });

  test("금배지: +250% damage per level, only at floor 3000 or below", () => {
    const low = mods(at(1000, 500)).dmgMult;
    const high = mods(at(1000, 3500)).dmgMult;
    const none = mods(at(999, 500)).dmgMult;
    expect(low / none).toBeCloseTo(3.5, 9);
    expect(high).toBeCloseTo(none, 9);
  });

  test("공로패 gold, 손목시계 attack speed, 명함 뭉치 clone", () => {
    expect(mods(at(2000)).goldMult / mods(at(1999)).goldMult).toBeCloseTo(1.5, 9);
    expect(mods(at(3000)).aspdMult / mods(at(2999)).aspdMult).toBeCloseTo(1.05, 9);
    expect(mods(at(4000, 3500)).dmgMult / mods(at(3999, 3500)).dmgMult).toBeCloseTo(1.4, 9);
  });

  test("파스 strengthens tier-3 certificates", () => {
    const s = at(8000, 3500);
    s.certs = { c30: 1 };
    const t = at(7999, 3500);
    t.certs = { c30: 1 };
    expect(mods(s).dmgMult).toBeGreaterThan(mods(t).dmgMult * 1.0001);
  });
});
```
(`c30`은 3차 자격증 중 첫 번째이고 종류가 `atk`다 — `30 % 8 = 6`이면 `prestige`이므로, 테스트 작성 시 `CERTS.find((c) => c.tier === 3 && c.kind === "atk")!.id`로 고른다. 위 코드의 `"c30"` 두 곳을 그 값으로 바꾼다.)

- [ ] **Step 2: 실패 확인** — FAIL

- [ ] **Step 3: 구현**

`shared/data/relics.ts`:
```ts
// 퇴직 기념품: each arrives on its own at its floor and levels with
// 보석. 7000층's (mining power) waits for the stock-market content.
export interface RelicDef {
  id: string;
  name: string;
  unlockFloor: number;
  text: string;
}

export const RELICS: readonly RelicDef[] = [
  { id: "r_badge", name: "근속 25년 금배지", unlockFloor: 1000, text: "3000층 이하에서 데미지 +250%" },
  { id: "r_plaque", name: "공로패", unlockFloor: 2000, text: "골드 +50%" },
  { id: "r_watch", name: "명품 손목시계", unlockFloor: 3000, text: "공격 속도 +5%" },
  { id: "r_cards", name: "명함 뭉치", unlockFloor: 4000, text: "분신이 공격력 40%로 함께 공격" },
  { id: "r_pin", name: "부장님 넥타이핀", unlockFloor: 5000, text: "공주임 버프 효과 +30%" },
  { id: "r_stamp", name: "대형 결재 도장", unlockFloor: 6000, text: "김인턴 추가 공격 +1%" },
  { id: "r_pas", name: "파스", unlockFloor: 8000, text: "3차 자격증 효과 +20%" },
  { id: "r_fan", name: "부채", unlockFloor: 9000, text: "아파트 +2평으로 계산" },
];

const BY_ID = new Map(RELICS.map((r) => [r.id, r]));

export function findRelic(id: string): RelicDef | undefined {
  return BY_ID.get(id);
}

export function relicsUnlocked(bestFloor: number): RelicDef[] {
  return RELICS.filter((r) => bestFloor >= r.unlockFloor);
}

// The 보석 cost of going from `level` to `level + 1`.
export function relicLevelCost(level: number): number {
  return Math.ceil(100 * 1.25 ** (level - 1));
}
```

`shared/mods.ts`:
- import `relicsUnlocked`
- helper:
```ts
// A relic's level, 0 while it has not arrived yet.
export function relicLevel(s: GameState, id: string): number {
  return relicsUnlocked(s.bestFloor).some((r) => r.id === id) ? (s.relics[id] ?? 1) : 0;
}
```
- `mods` 안에서 `certBonuses(s.certs, 1 + 0.2 * relicLevel(s, "r_pas"))`
- `applyPets(s, m)` 호출 전에 `applyRelics(s, m)`:
```ts
function applyRelics(s: GameState, m: Mods): void {
  if (s.run.floor <= 3000) m.dmgMult *= 1 + 2.5 * relicLevel(s, "r_badge");
  m.goldMult *= 1 + 0.5 * relicLevel(s, "r_plaque");
  m.aspdMult *= 1 + 0.05 * relicLevel(s, "r_watch");
  m.dmgMult *= 1 + 0.4 * relicLevel(s, "r_cards");
}
```
- `applyPets`의 김인턴 줄에 `× (1 + 0.01 * relicLevel(s, "r_stamp"))`, 공주임의 버프 배율 `2 * boost`를 `2 * boost * (1 + 0.3 * relicLevel(s, "r_pin"))`로.

`r_badge`는 현재 층(`run.floor`)을 보므로 정산 한 번 안에서는 시작 층 기준이다(3000층을 넘는 순간의 차이는 다음 정산에서 맞춰진다). 이 점을 `applyRelics` 위에 주석으로 남긴다.

- [ ] **Step 4: 통과 확인 후 배포**
```bash
bash "$TEMP/ship.sh" "feat: eight retirement relics arriving by floor" shared
```

---

### Task 5: 아파트, 정장, 사무용품

**Files:**
- Create: `shared/data/home.ts`, `shared/home.test.ts`
- Modify: `shared/mods.ts`

**Interfaces:**
- Produces:
  - 아파트: `apartmentCost(pyeong: number): number`(보석, `pyeong → pyeong+1`), `apartmentDamage(effectivePyeong): number` = `2 ** floor(평/10)`
  - 정장: `SUIT_PARTS`(6: hair, suit, coat, gloves, shoes, tie), `SUIT_SETS`(6), `interface SuitPart { id: string; set: number; part: string; name: string; price: number }`, `SUIT_ITEMS`(36개, id `s{세트}_{부위}`), `findSuitItem`, `suitSetWorn(wear: Record<string, string>, set: number): boolean`
  - 사무용품: `type OfficePart = "keyboard" | "mouse" | "chair" | "monitor"`, `OFFICE_PARTS`, `officeUpgradeCost(grade): number`(상품권, `grade → grade+1`, 1→2가 200)

효과:
- 아파트: 데미지 ×`2^floor((평 + 2×부채Lv)/10)`
- 정장: **착용한 것만 효과**(사용자 결정). 착용한 부위 하나당 데미지 +5%×(그 세트 번호) (합산). 같은 세트 6부위를 모두 착용하면 세트 보너스: 1 골드 +20%, 2 공속 +10%, 3 보스 +30%, 4 부업 +50%, 5 데미지 +50%, 6 골드 +100%.
- 정장 가격: 상품권 `30 × 3^(t−1)`
- 사무용품(등급 g, 1에서 시작): 키보드 데미지 ×(1+0.15(g−1)), 마우스 치명타 데미지 +0.05(g−1), 의자 보스 ×(1+0.1(g−1)), 모니터 골드 ×(1+0.1(g−1))
- 사무용품 비용: 상품권 `ceil(200 × 1.3^(g−1))`

- [ ] **Step 1: 실패하는 테스트**

`shared/home.test.ts`:
```ts
import { describe, expect, test } from "vitest";
import { SUIT_ITEMS, apartmentCost, apartmentDamage, officeUpgradeCost, suitSetWorn } from "./data/home";
import { mods } from "./mods";
import { newState } from "./state";

describe("apartment", () => {
  test("damage doubles every 10 pyeong; each pyeong costs more", () => {
    expect(apartmentDamage(9)).toBe(1);
    expect(apartmentDamage(10)).toBe(2);
    expect(apartmentDamage(25)).toBe(4);
    expect(apartmentCost(5)).toBeGreaterThan(apartmentCost(4));
    const s = newState(0);
    s.apartment = 10;
    expect(mods(s).dmgMult / mods(newState(0)).dmgMult).toBeCloseTo(2, 9);
  });
});

describe("suits", () => {
  test("6 sets × 6 parts, dearer by set", () => {
    expect(SUIT_ITEMS).toHaveLength(36);
    expect(new Set(SUIT_ITEMS.map((i) => i.id)).size).toBe(36);
    const p1 = SUIT_ITEMS.find((i) => i.set === 1)!.price;
    const p2 = SUIT_ITEMS.find((i) => i.set === 2)!.price;
    expect(p2).toBe(p1 * 3);
  });

  test("only worn parts count; a fully worn set adds its bonus", () => {
    const set1 = SUIT_ITEMS.filter((i) => i.set === 1);
    const s = newState(0);
    s.suits = set1.map((i) => i.id);
    expect(mods(s).dmgMult).toBeCloseTo(1, 9);
    s.wear = Object.fromEntries(set1.slice(0, 5).map((i) => [i.part, i.id]));
    expect(suitSetWorn(s.wear, 1)).toBe(false);
    expect(mods(s).dmgMult).toBeCloseTo(1 + 0.05 * 5, 9);
    s.wear = Object.fromEntries(set1.map((i) => [i.part, i.id]));
    expect(suitSetWorn(s.wear, 1)).toBe(true);
    expect(mods(s).goldMult).toBeCloseTo(1.2, 9);
  });
});

describe("office", () => {
  test("grade 1 → 2 costs 200 coupons", () => {
    expect(officeUpgradeCost(1)).toBe(200);
    expect(officeUpgradeCost(2)).toBeGreaterThan(200);
  });

  test("grades raise their stat", () => {
    const s = newState(0);
    s.office = { keyboard: 3, mouse: 1, chair: 1, monitor: 2 };
    expect(mods(s).dmgMult).toBeCloseTo(1.3, 9);
    expect(mods(s).goldMult).toBeCloseTo(1.1, 9);
  });
});
```

- [ ] **Step 2: 실패 확인** — FAIL

- [ ] **Step 3: 구현**

`shared/data/home.ts`:
```ts
// 집 (home) content. 아파트: 보석, damage ×2 every 10. 정장: six parts, bought with 상품권, a bonus
// for a full set. 사무용품: four parts owned from the start, upgraded with 상품권 from grade 1 to 17
// (1 → 2 costs 200). No draws anywhere.
export function apartmentCost(pyeong: number): number {
  return Math.ceil(10 * 1.1 ** pyeong);
}

export function apartmentDamage(pyeong: number): number {
  return 2 ** Math.floor(pyeong / 10);
}

export const SUIT_PARTS = [
  { key: "hair", name: "가발" },
  { key: "suit", name: "정장" },
  { key: "coat", name: "코트" },
  { key: "gloves", name: "장갑" },
  { key: "shoes", name: "구두" },
  { key: "tie", name: "넥타이" },
] as const;

export const SUIT_SETS = [
  { set: 1, name: "신입", bonus: "골드 +20%" },
  { set: 2, name: "영업왕", bonus: "공격 속도 +10%" },
  { set: 3, name: "골프 접대", bonus: "보스 데미지 +30%" },
  { set: 4, name: "주말 등산", bonus: "부업 수입 +50%" },
  { set: 5, name: "임원", bonus: "데미지 +50%" },
  { set: 6, name: "회장님", bonus: "골드 +100%" },
] as const;

export interface SuitItem {
  id: string;
  set: number;
  part: string;
  name: string;
  price: number;
}

export const SUIT_ITEMS: readonly SuitItem[] = SUIT_SETS.flatMap(({ set, name }) =>
  SUIT_PARTS.map((p) => ({ id: `s${set}_${p.key}`, set, part: p.key, name: `${name} ${p.name}`, price: 30 * 3 ** (set - 1) })),
);

const BY_ID = new Map(SUIT_ITEMS.map((i) => [i.id, i]));

export function findSuitItem(id: string): SuitItem | undefined {
  return BY_ID.get(id);
}

// Every part of the set worn (wear: part → item id).
export function suitSetWorn(wear: Record<string, string>, set: number): boolean {
  return SUIT_PARTS.every((p) => wear[p.key] === `s${set}_${p.key}`);
}

export type OfficePart = "keyboard" | "mouse" | "chair" | "monitor";

export const OFFICE_PARTS: readonly { key: OfficePart; name: string; text: string }[] = [
  { key: "keyboard", name: "키보드", text: "데미지 +15%" },
  { key: "mouse", name: "마우스", text: "치명타 데미지 +5%" },
  { key: "chair", name: "의자", text: "보스 데미지 +10%" },
  { key: "monitor", name: "모니터", text: "골드 +10%" },
];

// The 상품권 cost of going from `grade` to `grade + 1`.
export function officeUpgradeCost(grade: number): number {
  return Math.ceil(200 * 1.3 ** (grade - 1));
}
```

`shared/mods.ts`에 `applyHome(s, m)`를 추가하고 `mods` 안에서 `applyRelics` 다음에 부른다:
```ts
function applyHome(s: GameState, m: Mods): void {
  m.dmgMult *= apartmentDamage(s.apartment + 2 * relicLevel(s, "r_fan"));

  // Worn suits only (what Park is seen wearing is what counts).
  let parts = 0;
  for (const id of Object.values(s.wear)) parts += findSuitItem(id)?.set ?? 0;
  m.dmgMult *= 1 + 0.05 * parts;
  if (suitSetWorn(s.wear, 1)) m.goldMult *= 1.2;
  if (suitSetWorn(s.wear, 2)) m.aspdMult *= 1.1;
  if (suitSetWorn(s.wear, 3)) m.bossMult *= 1.3;
  if (suitSetWorn(s.wear, 4)) m.sideJobMult *= 1.5;
  if (suitSetWorn(s.wear, 5)) m.dmgMult *= 1.5;
  if (suitSetWorn(s.wear, 6)) m.goldMult *= 2;

  m.dmgMult *= 1 + 0.15 * (s.office.keyboard - 1);
  m.critDmgAdd += 0.05 * (s.office.mouse - 1);
  m.bossMult *= 1 + 0.1 * (s.office.chair - 1);
  m.goldMult *= 1 + 0.1 * (s.office.monitor - 1);
}
```
(정장 부위 효과 "세트 t의 부위 하나당 +5%×t"는 `parts`에 세트 번호를 더하는 것으로 구현된다.)

- [ ] **Step 4: 통과 확인 후 배포**
```bash
bash "$TEMP/ship.sh" "feat: apartment, suits and office gear" shared
```

---

### Task 6: 영구 성장 의도

**Files:**
- Modify: `shared/actions.ts`, `shared/actions.test.ts`, `shared/state.ts` (id 검증을 표 기반으로)

**Interfaces:**
- `Intent` 추가: `{ k: "levelPet"; id: string } | { k: "petBox" } | { k: "levelRelic"; id: string } | { k: "expandApartment" } | { k: "buySuit"; id: string } | { k: "wearSuit"; id: string } | { k: "upgradeOffice"; part: OfficePart }`
- 새 거절 코드: `not_enough_coupons`, `owned`
- 규칙:
  - `levelPet`: 해금된 동료만(`locked`), 보석 `petLevelCost(level)`
  - `petBox`: 해금된 동료가 없으면 `locked`. 상품권 70. 시드 난수로 해금된 동료 중 하나를 골라 +1레벨.
  - `levelRelic`: 도착한 기념품만(`locked`), 보석 `relicLevelCost(level)`
  - `expandApartment`: 보석 `apartmentCost(평)`, 평 +1
  - `buySuit`: 없는 id면 `unknown`, 이미 있으면 `owned`, 상품권 `price`. 그 부위에 입은 게 없으면 바로 입는다.
  - `wearSuit`: 보유한 아이템만(`not_owned`), 그 부위에 입는다(무료).
  - `upgradeOffice`: 17등급이면 `max`, 상품권 `officeUpgradeCost(grade)`
- `fromSave`의 `pets`/`relics`/`suits` 키 검증을 `findPet`/`findRelic`/`findSuitItem`으로 바꾼다.
- 이직은 이 값들을 건드리지 않는다(영구 성장).

- [ ] **Step 1: 실패하는 테스트**

`shared/actions.test.ts`에 추가(import: `PET_BOX_COUPONS, petLevelCost` from pets, `relicLevelCost` from relics, `SUIT_ITEMS, apartmentCost, officeUpgradeCost` from home):
```ts
describe("permanent growth", () => {
  const base = (extra: Partial<GameState> = {}) => ({ ...rich(), gems: 10_000, coupons: 10_000, ...extra });

  test("pets: level with gems once joined", () => {
    expect(codeOf(base(), { k: "levelPet", id: "p_intern" })).toBe("locked");
    const s = base({ bestFloor: 100 });
    const after = applyIntent(s, { k: "levelPet", id: "p_intern" });
    expect(after.pets.p_intern).toBe(2);
    expect(after.gems).toBe(10_000 - petLevelCost(1));
  });

  test("the pet box levels a random joined pet, the same one the server picks", () => {
    expect(codeOf(base(), { k: "petBox" })).toBe("locked");
    const s = base({ bestFloor: 600 });
    const a = applyIntent(s, { k: "petBox" });
    const b = applyIntent(s, { k: "petBox" });
    expect(a.pets).toEqual(b.pets);
    expect(Object.values(a.pets)).toEqual([2]);
    expect(a.coupons).toBe(10_000 - PET_BOX_COUPONS);
    expect(codeOf({ ...s, coupons: 0 }, { k: "petBox" })).toBe("not_enough_coupons");
  });

  test("relics: level with gems once arrived", () => {
    expect(codeOf(base(), { k: "levelRelic", id: "r_badge" })).toBe("locked");
    const after = applyIntent(base({ bestFloor: 1000 }), { k: "levelRelic", id: "r_badge" });
    expect(after.relics.r_badge).toBe(2);
    expect(after.gems).toBe(10_000 - relicLevelCost(1));
  });

  test("apartment: one pyeong for gems", () => {
    const after = applyIntent(base(), { k: "expandApartment" });
    expect(after.apartment).toBe(1);
    expect(after.gems).toBe(10_000 - apartmentCost(0));
  });

  test("suits: buy each part once", () => {
    const item = SUIT_ITEMS[0];
    const after = applyIntent(base(), { k: "buySuit", id: item.id });
    expect(after.suits).toEqual([item.id]);
    expect(after.coupons).toBe(10_000 - item.price);
    expect(codeOf(after, { k: "buySuit", id: item.id })).toBe("owned");
    expect(codeOf(base(), { k: "buySuit", id: "s9_hat" })).toBe("unknown");
    expect(after.wear[item.part]).toBe(item.id);
  });

  test("suits: wear an owned part, swapping what was on", () => {
    const a = SUIT_ITEMS.find((i) => i.set === 1 && i.part === "tie")!;
    const b = SUIT_ITEMS.find((i) => i.set === 2 && i.part === "tie")!;
    const s = base({ suits: [a.id, b.id], wear: { tie: a.id } });
    expect(applyIntent(s, { k: "wearSuit", id: b.id }).wear).toEqual({ tie: b.id });
    expect(codeOf(base(), { k: "wearSuit", id: b.id })).toBe("not_owned");
  });

  test("office: upgrade a grade with coupons, up to 17", () => {
    const after = applyIntent(base(), { k: "upgradeOffice", part: "chair" });
    expect(after.office.chair).toBe(2);
    expect(after.coupons).toBe(10_000 - officeUpgradeCost(1));
    expect(codeOf(base({ office: { keyboard: 17, mouse: 1, chair: 1, monitor: 1 } }), { k: "upgradeOffice", part: "keyboard" })).toBe("max");
  });

  test("a job change keeps all of it", () => {
    const s = base({ bestFloor: 1000, apartment: 3, suits: [SUIT_ITEMS[0].id], wear: { hair: SUIT_ITEMS[0].id }, pets: { p_intern: 4 }, relics: { r_badge: 2 } });
    s.run = { ...s.run, floor: 100, maxFloor: 100 };
    const after = applyIntent(s, { k: "prestige", boosted: false });
    expect(after.apartment).toBe(3);
    expect(after.suits).toEqual([SUIT_ITEMS[0].id]);
    expect(after.wear).toEqual({ hair: SUIT_ITEMS[0].id });
    expect(after.pets).toEqual({ p_intern: 4 });
    expect(after.relics).toEqual({ r_badge: 2 });
  });
});
```
그리고 `readIntent` 테스트에:
```ts
    expect(readIntent({ k: "upgradeOffice", part: "chair" })).toEqual({ k: "upgradeOffice", part: "chair" });
    expect(readIntent({ k: "upgradeOffice", part: "desk" })).toBeNull();
    expect(readIntent({ k: "petBox" })).toEqual({ k: "petBox" });
```
`shared/state.test.ts`의 "office grades …" 테스트의 `save.suits`는 실제 id(`s1_hair`, `s2_suit`)를 쓰고 있으므로 그대로 통과한다.

- [ ] **Step 2: 실패 확인** — FAIL

- [ ] **Step 3: 구현**

`shared/actions.ts`:
- import: `findPet, petLevelCost, petsUnlocked, PET_BOX_COUPONS` from pets, `findRelic, relicLevelCost, relicsUnlocked` from relics, `apartmentCost, findSuitItem, officeUpgradeCost, OFFICE_PARTS, type OfficePart` from home, `OFFICE_MAX_GRADE` from state, `petLevel, relicLevel` from mods
- `Intent`에 6개 추가
- `readIntent`에:
```ts
    case "petBox":
    case "expandApartment":
      return { k: r.k };
    case "levelPet":
    case "levelRelic":
    case "buySuit":
    case "wearSuit":
      return typeof r.id === "string" && r.id.length <= 32 ? { k: r.k, id: r.id } : null;
    case "upgradeOffice":
      return OFFICE_PARTS.some((p) => p.key === r.part) ? { k: "upgradeOffice", part: r.part as OfficePart } : null;
```
- helper:
```ts
function spendCoupons(s: GameState, n: number): void {
  if (s.coupons < n) throw new RuleError("not_enough_coupons");
  s.coupons -= n;
}
```
- `applyIntent`에:
```ts
    case "levelPet": {
      const pet = findPet(intent.id);
      if (!pet) throw new RuleError("unknown");
      if (s.bestFloor < pet.unlockFloor) throw new RuleError("locked");
      const level = petLevel(s, pet.id);
      spendGems(s, petLevelCost(level));
      s.pets[pet.id] = level + 1;
      return s;
    }
    case "petBox": {
      const pool = petsUnlocked(s.bestFloor);
      if (pool.length === 0) throw new RuleError("locked");
      spendCoupons(s, PET_BOX_COUPONS);
      const draw = nextRandom(s.rngSeed);
      s.rngSeed = draw.seed;
      const pet = pool[Math.floor(draw.value * pool.length)];
      s.pets[pet.id] = petLevel(s, pet.id) + 1;
      return s;
    }
    case "levelRelic": {
      const relic = findRelic(intent.id);
      if (!relic) throw new RuleError("unknown");
      if (s.bestFloor < relic.unlockFloor) throw new RuleError("locked");
      const level = relicLevel(s, relic.id);
      spendGems(s, relicLevelCost(level));
      s.relics[relic.id] = level + 1;
      return s;
    }
    case "expandApartment": {
      spendGems(s, apartmentCost(s.apartment));
      s.apartment += 1;
      return s;
    }
    case "buySuit": {
      const item = findSuitItem(intent.id);
      if (!item) throw new RuleError("unknown");
      if (s.suits.includes(item.id)) throw new RuleError("owned");
      spendCoupons(s, item.price);
      s.suits = [...s.suits, item.id];
      if (!s.wear[item.part]) s.wear = { ...s.wear, [item.part]: item.id };
      return s;
    }
    case "wearSuit": {
      const item = findSuitItem(intent.id);
      if (!item || !s.suits.includes(item.id)) throw new RuleError("not_owned");
      s.wear = { ...s.wear, [item.part]: item.id };
      return s;
    }
    case "upgradeOffice": {
      const grade = s.office[intent.part];
      if (grade >= OFFICE_MAX_GRADE) throw new RuleError("max");
      spendCoupons(s, officeUpgradeCost(grade));
      s.office = { ...s.office, [intent.part]: grade + 1 };
      return s;
    }
```

`shared/state.ts`의 `fromSave`: `levels(data.pets, "p_")`를 `findPet`으로, `levels(data.relics, "r_")`를 `findRelic`으로, `suits` 필터의 `x.startsWith("s")`를 `findSuitItem(x) !== undefined`로 바꾼다(import 추가). 순환 import 없음(`data/*`는 state를 import하지 않는다).

- [ ] **Step 4: 통과 확인 후 배포**
```bash
bash "$TEMP/ship.sh" "feat: intents for pets, relics, apartment, suits and office gear" shared
```

---

### Task 7: 화면 구조 (하단 메뉴 6개, 전투 화면 버튼, 전체 장비 목록)

**Files:**
- Create: `src/ui/CurrencyBar.tsx`, `src/ui/BottomNav.tsx`, `src/ui/Sheet.tsx`, `src/ui/PetPanel.tsx`, `src/ui/HomePanels.tsx`
- Modify: `src/App.tsx`, `src/ui/Battle.tsx`, `src/ui/GearPanel.tsx`, `src/ui/PrestigePanel.tsx`, `src/ui/text.ts`, `src/index.css`, `shared/data/floors.ts`, `shared/data/data.test.ts`
- Delete: `src/ui/TopBar.tsx`

**화면 구성**:

| 위치 | 구성 |
|---|---|
| 상단 | "마왕그룹 {부서}", N층, 층 진행 바(처치 수) |
| 전투 화면 왼쪽 아래 | "이직 📝+N" 버튼 → 이직 창 |
| 전투 화면 오른쪽 아이콘 | 👔 정장, 🏠 아파트, 🏅 기념품, 🖥 사무용품 (던전 패스/핫딜은 6단계) |
| 전투 화면 아래 재화 줄 | 💰 골드, 📝 응시권, 💎 보석, 🎟 상품권 |
| 장비 목록 | 업무 장비 30개 전부 표시(Lv x/5, ATK, 버튼) |
| 하단 메뉴 | 부업, 장비, 동료, 자격증, 상점, 던전 (잠금 표시) |

잠금 조건: 동료 = 최고 100층, 자격증 = 최고 11층(첫 팀장 보스 처치 = 첫 응시권), 상점 = 6단계, 던전 = 5단계("준비 중").

**Interfaces:**
- `departmentOf(floor: number): string` (`shared/data/floors.ts`): 100층마다 총무팀 → 영업팀 → 법무팀 → 개발팀 → 재무팀 → 임원실 순환
- `type SheetId = "prestige" | "suits" | "apartment" | "relics" | "office"`
- `Battle({ state, onOpen }: { state: GameState; onOpen: (id: SheetId) => void })`
- `BottomNav({ state, tab, onPick })`, `type NavTab = "sideJobs" | "gear" | "pets" | "certs" | "shop" | "dungeon"`

- [ ] **Step 1: `departmentOf` 테스트와 구현**

`shared/data/data.test.ts`의 `describe("floors")`에 추가(import에 `departmentOf`):
```ts
  test("a department every 100 floors, cycling through six", () => {
    expect(departmentOf(1)).toBe("총무팀");
    expect(departmentOf(100)).toBe("총무팀");
    expect(departmentOf(101)).toBe("영업팀");
    expect(departmentOf(601)).toBe("총무팀");
  });
```
`shared/data/floors.ts`:
```ts
export const DEPARTMENTS = ["총무팀", "영업팀", "법무팀", "개발팀", "재무팀", "임원실"] as const;

// The department theme (background and monster set, step 7) for a floor: a new one every 100 floors.
export function departmentOf(floor: number): string {
  return DEPARTMENTS[Math.floor((floor - 1) / 100) % DEPARTMENTS.length];
}
```

- [ ] **Step 2: 화면 컴포넌트**

`src/ui/text.ts`의 `ERRORS`에 `not_enough_coupons: "상품권이 부족해요"`, `owned: "이미 가지고 있어요"` 추가.

`src/ui/CurrencyBar.tsx`:
```tsx
import { formatBig } from "../../shared/format";
import type { GameState } from "../../shared/state";

export function CurrencyBar({ state }: { state: GameState }) {
  return (
    <div className="currency">
      <span>💰 {formatBig(state.gold)}</span>
      <span>📝 {state.tickets}</span>
      <span>💎 {state.gems}</span>
      <span>🎟 {state.coupons}</span>
    </div>
  );
}
```

`src/ui/Sheet.tsx`:
```tsx
import type { ReactNode } from "react";

// A panel over the game (정장, 아파트 and the like open this way).
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <header>
          <b>{title}</b>
          <button onClick={onClose}>닫기</button>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
```

`src/ui/BottomNav.tsx`:
```tsx
import type { GameState } from "../../shared/state";

export type NavTab = "sideJobs" | "gear" | "pets" | "certs" | "shop" | "dungeon";

// The bottom menu (부업, 장비, 동료, 자격증, 상점, 던전), locked until it opens.
const ITEMS: { id: NavTab; icon: string; label: string; open: (s: GameState) => boolean; hint: string }[] = [
  { id: "sideJobs", icon: "📋", label: "부업", open: () => true, hint: "" },
  { id: "gear", icon: "🖊", label: "장비", open: () => true, hint: "" },
  { id: "pets", icon: "🧑‍💼", label: "동료", open: (s) => s.bestFloor >= 100, hint: "100층" },
  { id: "certs", icon: "📜", label: "자격증", open: (s) => s.bestFloor >= 11, hint: "11층" },
  { id: "shop", icon: "🛒", label: "상점", open: () => false, hint: "준비 중" },
  { id: "dungeon", icon: "🅿", label: "던전", open: () => false, hint: "준비 중" },
];

export function BottomNav({ state, tab, onPick }: { state: GameState; tab: NavTab; onPick: (t: NavTab) => void }) {
  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => {
        const open = item.open(state);
        return (
          <button key={item.id} className={item.id === tab ? "on" : ""} disabled={!open} onClick={() => onPick(item.id)}>
            <span className="icon">{open ? item.icon : "🔒"}</span>
            {open ? item.label : item.hint}
          </button>
        );
      })}
    </nav>
  );
}
```

`src/ui/Battle.tsx` 전체:
```tsx
import { useEffect, useRef } from "react";
import { certBonuses } from "../../shared/data/certs";
import { WALK_SEC, departmentOf, isBossFloor, targetsOn } from "../../shared/data/floors";
import { PRESTIGE_MIN_FLOOR, prestigeReward } from "../../shared/data/prestige";
import { skillsUnlocked } from "../../shared/data/skills";
import { targetSec } from "../../shared/settle";
import type { GameState } from "../../shared/state";
import { heroPower } from "../../shared/stats";

export type SheetId = "prestige" | "suits" | "apartment" | "relics" | "office";

// Gray-box stand-in for the step 7 sprite renderer: low-res canvas, scaled up crisp. The layout:
// title and floor bar on top, the job-change button bottom
// left, the side icons on the right.
const W = 160;
const H = 96;

const SIDE: { id: SheetId; icon: string; label: string }[] = [
  { id: "suits", icon: "👔", label: "정장" },
  { id: "apartment", icon: "🏠", label: "아파트" },
  { id: "relics", icon: "🏅", label: "기념품" },
  { id: "office", icon: "🖥", label: "사무용품" },
];

export function Battle({ state, onOpen }: { state: GameState; onOpen: (id: SheetId) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { floor, target, carrySec, farming, maxFloor } = state.run;
  const power = heroPower(state);
  const boss = isBossFloor(floor) && !farming;
  const bossLeft = Math.max(0, Math.ceil(power.bossLimitSec - carrySec));
  const skills = skillsUnlocked(state.bestFloor);
  const ready = maxFloor >= PRESTIGE_MIN_FLOOR;
  const reward = prestigeReward(maxFloor, certBonuses(state.certs).prestige);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const perKill = targetSec(floor, power) + WALK_SEC;
    const left = Number.isFinite(perKill) ? Math.max(0, 1 - carrySec / perKill) : 1;
    ctx.fillStyle = "#3d5a80";
    ctx.fillRect(0, 0, W, H * 0.65);
    ctx.fillStyle = "#6b4f2a";
    ctx.fillRect(0, H * 0.65, W, H * 0.35);
    ctx.fillStyle = "#e9c46a";
    ctx.fillRect(40, 44, 14, 18);
    ctx.fillStyle = boss ? "#d62828" : "#9d4edd";
    ctx.fillRect(boss ? 100 : 104, boss ? 38 : 46, boss ? 24 : 16, boss ? 24 : 16);
    ctx.fillStyle = "#400";
    ctx.fillRect(96, 66, 32, 3);
    ctx.fillStyle = "#e63946";
    ctx.fillRect(96, 66, 32 * left, 3);
  });

  return (
    <section className="battle">
      <canvas ref={ref} width={W} height={H} />
      <header className="battle-head">
        <div>마왕그룹 {departmentOf(floor)}</div>
        <div className="floor-no">{floor}층{farming ? " · 파밍 중" : ""}</div>
        <div className="floor-bar">
          <i style={{ width: `${(Math.min(target, targetsOn(floor)) / targetsOn(floor)) * 100}%` }} />
        </div>
        {boss && <div className="boss-timer">⏱ 보스 {bossLeft}초</div>}
      </header>
      <div className="side-icons">
        {SIDE.map((s) => (
          <button key={s.id} onClick={() => onOpen(s.id)}>
            <span>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>
      <button className="prestige-btn" onClick={() => onOpen("prestige")}>
        이직
        <small>{ready ? `📝 +${reward.tickets}` : `${PRESTIGE_MIN_FLOOR}층부터`}</small>
      </button>
      {skills.length > 0 && (
        <div className="skills">
          {skills.map((s) => (
            <span key={s.id}>{s.name}</span>
          ))}
        </div>
      )}
    </section>
  );
}
```

`src/ui/GearPanel.tsx` 전체 (30개 전부 표시):
```tsx
import { GEAR_MAX_LEVEL, GEAR_TIERS, gearAtk, gearLevelCost, gearPrice } from "../../shared/data/gear";
import { formatBig } from "../../shared/format";
import type { GameState } from "../../shared/state";
import type { GameStore } from "../game/store";

export function GearPanel({ state, store }: { state: GameState; store: GameStore }) {
  const { tier: current, level } = state.gear;
  return (
    <>
      {GEAR_TIERS.map((g, tier) => {
        const shownLevel = tier < current ? GEAR_MAX_LEVEL : tier === current ? level : 0;
        const atk = gearAtk(tier, tier <= current ? shownLevel : 0);
        let button;
        if (tier < current) {
          button = <button disabled>보유</button>;
        } else if (tier === current) {
          const cost = gearLevelCost(tier, level);
          const maxed = level >= GEAR_MAX_LEVEL;
          button = (
            <button disabled={maxed || state.gold.lt(cost)} onClick={() => store.do({ k: "levelGear" })}>
              {maxed ? "최대" : <>+1<br />{formatBig(cost)}</>}
            </button>
          );
        } else {
          const price = gearPrice(tier);
          const canBuy = tier === current + 1 && level >= GEAR_MAX_LEVEL;
          button = (
            <button disabled={!canBuy || state.gold.lt(price)} onClick={() => store.do({ k: "buyGear" })}>
              구매<br />{formatBig(price)}
            </button>
          );
        }
        return (
          <div key={g.id} className={`row${tier === current ? " current" : tier > current + 1 ? " far" : ""}`}>
            <div className="grow">
              <b>{tier + 1}. {g.name}</b>
              <div className="sub">LV.{shownLevel}/{GEAR_MAX_LEVEL} · ATK {formatBig(atk)}</div>
            </div>
            {button}
          </div>
        );
      })}
    </>
  );
}
```

`src/ui/PetPanel.tsx`: (이전 계획과 같음 — 동료 상자 행과 동료 7명 목록)
```tsx
import { PETS, PET_BOX_COUPONS, awakenStage, petLevelCost } from "../../shared/data/pets";
import { petLevel } from "../../shared/mods";
import type { GameState } from "../../shared/state";
import type { GameStore } from "../game/store";

export function PetPanel({ state, store }: { state: GameState; store: GameStore }) {
  const stage = awakenStage(state.bestFloor);
  const joined = PETS.filter((p) => state.bestFloor >= p.unlockFloor).length;
  return (
    <>
      <div className="row">
        <div className="grow">
          <b>동료 상자</b> 함께하는 동료 {joined}/{PETS.length}
          <div className="sub">랜덤 동료 1명 레벨 +1 · 각성 {stage}단계</div>
        </div>
        <button disabled={joined === 0 || state.coupons < PET_BOX_COUPONS} onClick={() => store.do({ k: "petBox" })}>
          열기<br />🎟 {PET_BOX_COUPONS}
        </button>
      </div>
      {PETS.map((pet) => {
        if (state.bestFloor < pet.unlockFloor) {
          return (
            <div key={pet.id} className="row locked">
              <span>🔒 {pet.name}</span>
              <span className="sub">{pet.unlockFloor}층 도달 시 합류</span>
            </div>
          );
        }
        const level = petLevel(state, pet.id);
        const cost = petLevelCost(level);
        return (
          <div key={pet.id} className="row">
            <div className="grow">
              <b>{pet.name}</b> Lv{level}
              <div className="sub">{pet.text}</div>
            </div>
            <button disabled={state.gems < cost} onClick={() => store.do({ k: "levelPet", id: pet.id })}>
              레벨업<br />💎 {cost}
            </button>
          </div>
        );
      })}
    </>
  );
}
```

`src/ui/HomePanels.tsx`:
```tsx
import { OFFICE_PARTS, SUIT_ITEMS, SUIT_PARTS, SUIT_SETS, apartmentCost, apartmentDamage, officeUpgradeCost, suitSetWorn } from "../../shared/data/home";
import { RELICS, relicLevelCost } from "../../shared/data/relics";
import { relicLevel } from "../../shared/mods";
import { OFFICE_MAX_GRADE, type GameState } from "../../shared/state";
import type { GameStore } from "../game/store";

type Props = { state: GameState; store: GameStore };

export function ApartmentPanel({ state, store }: Props) {
  const cost = apartmentCost(state.apartment);
  return (
    <div className="row">
      <div className="grow">
        <b>박부장 아파트</b> {state.apartment}평
        <div className="sub">10평마다 데미지 2배 · 지금 ×{apartmentDamage(state.apartment)}</div>
      </div>
      <button disabled={state.gems < cost} onClick={() => store.do({ k: "expandApartment" })}>
        +1평<br />💎 {cost}
      </button>
    </div>
  );
}

export function RelicPanel({ state, store }: Props) {
  return (
    <>
      {RELICS.map((r) => {
        if (state.bestFloor < r.unlockFloor) {
          return (
            <div key={r.id} className="row locked">
              <span>🔒 {r.name}</span>
              <span className="sub">{r.unlockFloor}층 도달 시</span>
            </div>
          );
        }
        const level = relicLevel(state, r.id);
        const cost = relicLevelCost(level);
        return (
          <div key={r.id} className="row">
            <div className="grow">
              <b>{r.name}</b> Lv{level}
              <div className="sub">{r.text} / 레벨</div>
            </div>
            <button disabled={state.gems < cost} onClick={() => store.do({ k: "levelRelic", id: r.id })}>
              레벨업<br />💎 {cost}
            </button>
          </div>
        );
      })}
    </>
  );
}

// Worn parts are what count (and what step 7 draws on Park).
export function SuitPanel({ state, store }: Props) {
  return (
    <>
      <div className="sub">
        착용 중:{" "}
        {SUIT_PARTS.map((p) => SUIT_ITEMS.find((i) => i.id === state.wear[p.key])?.name ?? `${p.name} 없음`).join(" · ")}
      </div>
      {SUIT_SETS.map((set) => (
        <div key={set.set} className="suit-set">
          <div className="sub">
            <b>{set.name} 세트</b> · 6부위 착용 시 {set.bonus} {suitSetWorn(state.wear, set.set) && "✅"}
          </div>
          <div className="suit-grid">
            {SUIT_ITEMS.filter((i) => i.set === set.set).map((item) => {
              const owned = state.suits.includes(item.id);
              const worn = state.wear[item.part] === item.id;
              const label = item.name.split(" ").pop();
              if (worn) return <button key={item.id} className="worn" disabled>{label}<br />착용 중</button>;
              if (owned) return <button key={item.id} className="owned" onClick={() => store.do({ k: "wearSuit", id: item.id })}>{label}<br />착용</button>;
              return (
                <button key={item.id} disabled={state.coupons < item.price} onClick={() => store.do({ k: "buySuit", id: item.id })}>
                  {label}<br />🎟 {item.price}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

export function OfficePanel({ state, store }: Props) {
  return (
    <>
      {OFFICE_PARTS.map((p) => {
        const grade = state.office[p.key];
        const maxed = grade >= OFFICE_MAX_GRADE;
        const cost = officeUpgradeCost(grade);
        return (
          <div key={p.key} className="row">
            <div className="grow">
              <b>{p.name}</b> {grade}등급
              <div className="sub">{p.text} / 등급</div>
            </div>
            <button disabled={maxed || state.coupons < cost} onClick={() => store.do({ k: "upgradeOffice", part: p.key })}>
              {maxed ? "최대" : <>업그레이드<br />🎟 {cost}</>}
            </button>
          </div>
        );
      })}
    </>
  );
}
```

`src/ui/PrestigePanel.tsx`: 내용은 그대로 두고, 이제 창(Sheet) 안에 들어간다.

`src/App.tsx`의 `Game` 전체:
```tsx
const SHEET_TITLES: Record<SheetId, string> = {
  prestige: "이직", suits: "정장", apartment: "아파트", relics: "퇴직 기념품", office: "사무용품",
};

function Game({ store, connection, guest }: { store: GameStore; connection: Connection; guest: boolean }) {
  const state = useGameView(store);
  const [tab, setTab] = useState<NavTab>("gear");
  const [sheet, setSheet] = useState<SheetId | null>(null);

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
          <p>서버에 연결하지 못했어요</p>
          <button onClick={() => window.location.reload()}>다시 시도</button>
        </div>
      );
    }
    return <div className="screen">{connection === "trying" ? "서버에 연결하는 중…" : "출근 중…"}</div>;
  }

  return (
    <div className="phone">
      <StatusBanner connection={connection} guest={guest} />
      <Battle state={state} onOpen={setSheet} />
      <CurrencyBar state={state} />
      <main className="list">
        {tab === "sideJobs" && <SideJobPanel state={state} store={store} />}
        {tab === "gear" && <GearPanel state={state} store={store} />}
        {tab === "pets" && <PetPanel state={state} store={store} />}
        {tab === "certs" && <CertPanel state={state} store={store} />}
      </main>
      <BottomNav state={state} tab={tab} onPick={setTab} />
      {sheet && (
        <Sheet title={SHEET_TITLES[sheet]} onClose={() => setSheet(null)}>
          {sheet === "prestige" && <PrestigePanel state={state} store={store} />}
          {sheet === "suits" && <SuitPanel state={state} store={store} />}
          {sheet === "apartment" && <ApartmentPanel state={state} store={store} />}
          {sheet === "relics" && <RelicPanel state={state} store={store} />}
          {sheet === "office" && <OfficePanel state={state} store={store} />}
        </Sheet>
      )}
      <OfflinePopup store={store} />
      <Toast store={store} />
    </div>
  );
}
```
import를 맞추고(`BottomNav, type NavTab`, `type SheetId` from Battle, `CurrencyBar`, `Sheet`, `PetPanel`, `ApartmentPanel, OfficePanel, RelicPanel, SuitPanel`), `TopBar` import와 기존 `Tab`/`TABS` 정의를 지운다. `src/ui/TopBar.tsx`를 지운다(`git rm`).

`src/index.css`: `.topbar`, `.tabs`, `.tab` 규칙과 `.battle .floor` 규칙을 지우고 끝에 추가:
```css
.battle-head { position: absolute; top: 6px; left: 0; right: 0; display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 12px; text-shadow: 1px 1px 0 #000; pointer-events: none; }
.battle-head .floor-no { font-size: 14px; font-weight: 700; }
.floor-bar { width: 50%; height: 5px; background: #400; border: 1px solid #000; }
.floor-bar i { display: block; height: 100%; background: #6ab04c; }
.side-icons { position: absolute; right: 6px; top: 40px; display: flex; flex-direction: column; gap: 6px; }
.side-icons button { width: 48px; padding: 3px 0; border: 1px solid #000; border-radius: 6px; background: rgba(43, 36, 64, 0.85); color: #fff; font-size: 9px; display: flex; flex-direction: column; align-items: center; }
.side-icons button span { font-size: 18px; }
.prestige-btn { position: absolute; left: 6px; bottom: 26px; padding: 4px 10px; border: 1px solid #000; border-radius: 16px; background: rgba(43, 36, 64, 0.9); color: #fff; font-weight: 700; font-size: 12px; display: flex; flex-direction: column; align-items: center; }
.prestige-btn small { font-size: 10px; color: #ffd166; }
.currency { display: flex; justify-content: space-between; padding: 6px 12px; background: #120f20; font-weight: 700; font-size: 13px; }
.bottom-nav { display: flex; background: #120f20; border-top: 1px solid #2b2440; }
.bottom-nav button { flex: 1; padding: 6px 0; background: none; border: none; color: #b8b3d6; font-size: 11px; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.bottom-nav button .icon { font-size: 18px; }
.bottom-nav button.on { color: #e9c46a; font-weight: 700; background: #2b2440; }
.bottom-nav button:disabled { color: #555; }
.row.current { border-color: #e9c46a; }
.row.far { opacity: 0.55; }
.sheet { width: min(440px, 94vw); max-height: 80dvh; background: #1b1a2e; border: 1px solid #4a4370; border-radius: 10px; display: flex; flex-direction: column; overflow: hidden; }
.sheet header { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #2b2440; }
.sheet header button { border: none; background: #4a4370; color: #fff; border-radius: 4px; padding: 4px 10px; }
.sheet-body { overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 6px; }
.suit-set { background: #2f2a48; border: 1px solid #4a4370; border-radius: 6px; padding: 8px; display: flex; flex-direction: column; gap: 6px; }
.suit-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
.suit-grid button { padding: 6px 2px; border: none; border-radius: 4px; background: #2a9d8f; color: #fff; font-size: 11px; font-weight: 700; }
.suit-grid button:disabled { background: #555; color: #999; }
.suit-grid button.owned { background: #3a5a40; color: #cfe8cf; }
.suit-grid button.worn { background: #e9c46a; color: #000; }
```

- [ ] **Step 3: 타입 검사, 테스트, 브라우저 확인 (`?local`, 모바일 375×812)**

- 전투 화면 위에 "마왕그룹 총무팀", 층, 층 진행 바가 보인다. 오른쪽 아이콘 4개, 왼쪽 아래 이직 버튼이 있다.
- 전투 화면 바로 아래 재화 4개가 한 줄이다.
- 하단 메뉴 6개: 처음에는 동료, 자격증, 상점, 던전이 잠금으로 보인다.
- 장비 목록이 30개 전부 나오고, 현재 장비는 테두리 강조, Lv5 전에는 다음 장비를 살 수 없다.
- 로컬 세이브를 `bestFloor: 1100, gems: 5000, coupons: 3000`으로 고치고 새로고침: 동료 탭(5명 합류, 레벨업, 상자), 오른쪽 아이콘 창(아파트 +1평, 기념품 레벨업, 정장 구매→착용 중 표시→다른 세트 착용 교체, 사무용품 업그레이드), 이직 창이 동작한다.
- 콘솔 오류 없음

```bash
git rm -q src/ui/TopBar.tsx
bash "$TEMP/ship.sh" "feat: screen layout — bottom menu, battle buttons, full gear list" src shared
```

---

### Task 8: 서버 테스트와 문서

**Files:**
- Create: `server/test/growth.test.ts`
- Modify: 설계 문서, 로드맵

- [ ] **Step 1: 서버 테스트**

`server/test/growth.test.ts`:
```ts
import { newState, toSave } from "../../shared/state";

describe("permanent growth on the server", () => {
  test("a pet box levels the same pet on the server as on the client", async (server) => {
    server.connect({ account: "test-g1" });
    const s = newState(Date.now());
    s.bestFloor = 600;
    s.coupons = 100;
    await $global.updateUserState("test-g1", { save: toSave(s) });
    const r = await server.sync([{ k: "petBox" }]);
    expect(r.rejected.length).toBe(0);
    expect(Object.values(r.save.pets)).toEqual([2]);
    expect(r.save.coupons).toBe(30);
  });

  test("a version 2 save with gear above 5 comes down to 5", async (server) => {
    server.connect({ account: "test-g2" });
    const v2 = { ...toSave(newState(Date.now())), v: 2, gear: { tier: 1, level: 9 } } as Record<string, unknown>;
    for (const k of ["coupons", "ticketCarry", "pets", "relics", "apartment", "suits", "office"]) delete v2[k];
    await $global.updateUserState("test-g2", { save: v2 });
    const r = await server.sync([]);
    expect(r.save.v).toBe(3);
    expect(r.save.gear.level).toBe(5);
  });
});
```

- [ ] **Step 2: 설계 문서 반영**

- §5.1 업무 장비: "레벨은 최대 5. Lv5가 되어야 다음 장비를 살 수 있다."
- §5.3 동료: 새 구조로 다시 쓴다. 이 계획의 동료 표, 각성, 동료 상자(상품권 70, 랜덤 동료 +1레벨), 승급 생략을 넣는다.
- §5.3 퇴직 기념품: 기념품 표(8종, 7000층은 3차)로 바꾼다.
- §5.3 정장: 6부위(가발, 정장, 코트, 장갑, 구두, 넥타이) × 6세트, 세트 보너스.
- §5.3 사무용품: 4부위를 처음부터 보유, 상품권으로 1→17등급 업그레이드(1→2가 200), 뽑기 없음.
- §6.5 뽑기: "동료와 사무용품은 뽑기가 아니다(2026-10-06 사용자 결정). 확률형 요소는 동료 상자(랜덤 동료 +1레벨)와 자격증 응시다. VX 상품 구성은 6단계 계획 전에 다시 정한다."
- §5.1 스탯 강화를 지운다(하단 메뉴에 두지 않음, 공속과 치명타는 자격증에서). 업무 장비 수치는 ATK 50 ×3, 가격 600 ×6.
- §5.3 정장: 부위별 착용, 착용한 것만 효과, 6부위 같은 세트 착용 시 세트 보너스. 착용 정보는 캐릭터 외형 레이어로 그린다(7단계).
- §8.1: 새 화면 구조로 다시 쓴다. 전투 화면(위에 부서/층/진행 바, 왼쪽 아래 이직 버튼, 오른쪽 정장/아파트/기념품/사무용품 아이콘) → 재화 줄 → 목록 → 하단 메뉴 6개(부업, 장비, 동료, 자격증, 상점, 던전, 잠금 표시).
- §8.2 아트: 박부장은 기본 몸 + 부위별 레이어(정장 6부위, 손에 든 업무 장비)로 그린다. 애니메이션 프레임마다 레이어 위치를 맞춘다.
- 5단계 범위에 단계 미션(안내형 미션)을 추가한다.
- §10 결정 기록에 "구조 변경은 사용자 승인" 행 추가.
- 로드맵 4단계 행의 계획 링크.

- [ ] **Step 3: 배포**
```bash
bash "$TEMP/ship.sh" "test: permanent growth on the server; docs: step 4 decisions" server/test/growth.test.ts docs
```

---

## 4단계 완료 기준

- `npm test`, `npm run typecheck`, `npm run server:test` 통과, `develop` 푸시
- Task 7 브라우저 확인 항목 통과
- 미리보기 서버의 v2 세이브가 v3으로 이어진다
- 다음: 5단계(일일 콘텐츠 — 지하주차장이 상품권 수급처) 계획
