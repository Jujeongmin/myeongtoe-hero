# 6단계: 수익화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 보석 상점(버프, 골드 충전, 장비 +1), 쿨다운형 보상 광고, VX 상품(보석 묶음, 신입 패키지, 프리미엄, 월급 통장, 승진 패키지), VIP, 상점 화면, VX 대시보드 등록 시트를 넣는다.

**Architecture:** 규칙은 전부 `shared/`. 버프는 끝나는 시각(서버 시간 ms)으로 세이브에 두고, `settle`은 버프가 끝나는 시각에서 구간을 나눠 정산한다(나눠도 결과가 같다). 광고 보상은 `watchAd` 의도로 서버가 지급하고, 쿨다운은 서버 시간(`state.lastTick`)으로 판정한다. Verse8 광고는 서버 검증 API가 없어서 클라이언트가 광고를 끝까지 봤다는 말을 믿는다. 쿨다운이 남용을 막는다. VX 결제는 서버 `$onItemPurchased`가 `grantPurchase`(공용, 순수 함수)로 세이브에 지급하고, 같은 `purchaseId`는 한 번만 지급한다(유저 상태 `receipts`).

**Tech Stack:** 1~5단계와 같음 + `@verse8/ads`(보상형 광고), `@verse8/platform`의 `VXShop`

## Global Constraints

- 구조 변경은 구현 전 사용자 승인(2026-10-06). 이 계획의 구조는 아래 "사용자 결정"으로 승인받았다.
- 규칙은 `shared/`에만. 수치는 1차 값(8단계 시뮬레이터로 조정, 상수 이름 유지).
- 세이브 버전 7, 6→7 마이그레이션.
- 화면 텍스트는 픽셀 폰트 규칙(12px/24px만)을 지킨다. 브라우저 기본 스크롤바를 만들지 않는다.
- 게임 파일에 다른 게임을 따라 했다는 표현을 넣지 않는다.
- 커밋 직전 `npm test`, `npm run typecheck`, `npm run server:test`. 태스크마다 `bash "$TEMP/ship.sh" "<메시지>" <경로…>`.
- `art/`는 에셋 에이전트 작업 공간이다. 건드리지 않는다.

**사용자 결정 (2026-10-06):**
- 뽑기 광고 2개(사무용품·동료 무료 뽑기)는 **광고 골드**(처치 골드 50배)로 바꾼다.
- 신입 패키지는 보석 + 응시권 + 3종 버프 30분 + 상품권.
- 부업 자동화 자리는 VX 상품을 새로 넣지 않고 **보석 상점 아이템**(버프, 골드 충전, 장비 +1)으로 보석 소비처를 늘린다.
- 광고는 하루 상한 없이 **쿨다운**만 둔다.

---

### Task 1: 세이브 v7, 버프 정산

**Files:** Modify `shared/state.ts`, `shared/settle.ts`, `shared/stats.ts`, `shared/mods.ts`, `shared/data/gear.ts`(없음 — `heroAtk`만). Create `shared/data/buffs.ts`. Tests: `shared/buffs.test.ts`, `shared/state.test.ts`.

**Interfaces:**
- `shared/data/buffs.ts`: `type BuffKind = "atk" | "gold" | "move"`; `BUFFS: Record<BuffKind, { name: string; text: string; mult: number }>` = 공격력 ×6(야근 모드), 처치 골드 ×3(성과급), 이동 2배(칼퇴 걸음). `buffActive(s, kind): boolean` = `s.buffs[kind] > s.lastTick`.
- `GameState` 추가: `buffs: Record<BuffKind, number>`(끝나는 ms, 0이면 없음), `ads: Record<string, number>`(지면별 마지막 시청 ms), `startedAt: number`, `run.gearBoost: number`(이직하면 0), `vx: { total: number; premium: boolean; passUntil: number; dailyClaimed: string; rookie: boolean; promos: string[] }`, `offlineBonus: { gold: string; tickets: number; until: number } | null`.
- 마이그레이션 6→7: 위 필드 기본값, `startedAt = lastTick`.
- `Power`에 `walkSec` 추가. `heroPower`: 공격력 버프면 dmg ×6, 골드 버프면 goldMult ×3, 이동 버프면 `walkSec = WALK_SEC / 2`. `heroAtk`는 `gearAtk(tier, level + run.gearBoost)`.
- `settle`: `start = max(lastTick, now − cap)`, 그 사이의 버프 종료 시각마다 구간을 나눠 `settleBattle`/부업/박주임/주차권을 구간별로 정산(구간 안에서는 버프 상태가 일정).
- 테스트: 버프 중 골드 3배, 버프가 중간에 끝나면 정산을 어떻게 나눠도 같은 결과, 이동 버프로 처치가 빨라짐, `gearBoost` 공격력, v6 세이브 마이그레이션.

```bash
bash "$TEMP/ship.sh" "feat: timed buffs settled piecewise, save v7" shared
```

---

### Task 2: 보석 상점

**Files:** Create `shared/data/gemShop.ts`. Modify `shared/actions.ts`. Tests: `shared/gemShop.test.ts`.

**Interfaces:**
- `GEM_ITEMS`: `buff_atk`(보석 100, 공격력 ×6 30분), `buff_gold`(100, 처치 골드 ×3 30분), `buff_move`(250, 이동 2배 30분), `gold_100`(100, 처치 골드 100배), `gold_1000`(500, 처치 골드 1000배), `gear_boost`(20, 업무 장비 +1레벨 효과, 이직 전까지, 겹침).
- `killGoldNow(s): Big` = `killGold(s.run.floor) × heroPower(s).goldMult`(지금 처치 1마리 골드).
- `Intent`: `{ k: "buyGemItem"; id: string }`. 버프는 `max(지금, 남은 끝) + 30분`(이어서 연장). `not_enough_gems`, `unknown`.
- 테스트: 각 아이템 효과와 비용, 버프 연장, 이직하면 `gearBoost` 0.

```bash
bash "$TEMP/ship.sh" "feat: gem shop buffs, gold charges and gear boost" shared
```

---

### Task 3: 보상 광고 (쿨다운)

**Files:** Create `shared/data/ads.ts`, `src/net/ads.ts`. Modify `shared/actions.ts`, `shared/sync.ts`, `src/ui/OfflinePopup.tsx`, `package.json`(`@verse8/ads`). Tests: `shared/ads.test.ts`.

**Interfaces:**
- `AD_PLACEMENTS`: `ad_gems`(보석 5~20, 15분), `ad_gold`(처치 골드 50배, 15분), `ad_buff`(3종 버프 중 하나 3분, 30분), `ad_coupons`(상품권 20, 60분), `ad_parking`(주차권 +1, 120분), `ad_offline`(방치 보상 한 번 더, 오프라인 팝업이 떠 있는 동안).
- 월급 통장이 있으면 쿨다운 절반. VIP 7이면 광고 버프 시간 2배.
- `adReadyAt(s, id): number`(다음 시청 가능 ms). `Intent`: `{ k: "watchAd"; id: string }` — 쿨다운이 남았으면 `cooldown`. 랜덤(보석 양, 버프 종류)은 `rngSeed`.
- `syncSave`: 오프라인 보고가 있으면 `offlineBonus = { gold, tickets, until: now + 10분 }`. `ad_offline`은 그만큼 한 번 더 주고 `offlineBonus = null`.
- `src/net/ads.ts`: `initAds()`, `watchAd(placementId): Promise<"rewarded" | "skipped" | "unavailable">`. 개발 빌드는 바로 `"rewarded"`. 프리미엄이면 광고 없이 바로 보상.
- 테스트: 쿨다운, 월급 통장 절반, 보상 내용, 클라이언트와 서버가 같은 보석 양(시드).

```bash
bash "$TEMP/ship.sh" "feat: rewarded ads on cooldowns" shared src package.json package-lock.json
```

---

### Task 4: VX 상품과 VIP

**Files:** Create `shared/data/shop.ts`, `shared/vip.ts`, `src/net/shop.ts`. Modify `server/src/server.ts`, `shared/actions.ts`, `shared/mods.ts`, `shared/stats.ts`, `shared/data/parking.ts`(주차권 상한), `shared/actions.ts`(출석 보석 +20%). Tests: `shared/shop.test.ts`, `server/test/purchase.test.ts`.

**Interfaces:**
- `PRODUCTS`(SKU, 이름 KO/EN, 설명 KO/EN, 가격 VX, 유형, 내용):
  - `gems_xs`~`gems_xxl`: 100/500/1,000/3,000/5,000/10,000 VX → 보석 120/650/1,400/4,500/8,000/17,000.
  - `pack_rookie`: 500 VX, 시작 7일 안 1회 — 보석 1,000, 응시권 5,000, 3종 버프 30분, 상품권 300.
  - `premium`: 1,000 VX, 1회 — 광고 없이 보상, 오프라인 +4시간, 매일 보석 100.
  - `pass_salary`: 1,000 VX, 30일(반복 구매하면 30일 연장) — 매일 보석 300.
  - `pack_promo_100/300/500/1000`: 500/1,000/1,500/2,000 VX, 해당 층 첫 도달 후 1회 — 보석, 응시권, 상품권.
- `grantPurchase(s, productId, quantity, now): GameState` — 지급과 `vx.total += 가격 × 수량`. 모르는 상품은 throw.
- `vipLevel(total)`: 100/500/1,000/2,500/5,000/8,000/15,000/25,000/35,000/50,000. 혜택: 오프라인 +1/+1/+2시간(1,4,8), 출석 보석 +20%(2), 주차권 상한 +1(3,6), 부업 수입 +20%(5,9), 광고 버프 2배(7), VIP 정장 세트와 칭호(10, 외형은 7단계).
- `Intent`: `{ k: "claimDailyVx" }` — 오늘(KST) 프리미엄 100 + 월급 통장 300(유효할 때)을 한 번에. 둘 다 없으면 `locked`, 받았으면 `claimed`.
- 서버 `$onItemPurchased(raw)`: `readPurchaseEvent` → `$lock(save:account)` 안에서 `receipts`에 `purchaseId`가 없으면 `grantPurchase` 후 저장, 있으면 `already_granted`. 응답 `{ success, code }`.
- `src/net/shop.ts`: `startShop(verse, account)`, `buyProduct(productId)`, `productPrice(productId)`, `onShopClosed(cb)` — 닫히면 `store` 강제 동기화.
- 테스트: 지급 내용, 같은 영수증 두 번이면 한 번만, 신입 패키지 7일 제한, 승진 패키지 층 조건, VIP 단계와 혜택, 일일 수령.

```bash
bash "$TEMP/ship.sh" "feat: VX products, purchase grants and VIP" shared server src
```

---

### Task 5: 상점 화면과 버프 표시

**Files:** Create `src/ui/ShopPanel.tsx`, `src/ui/BuffBar.tsx`. Modify `src/App.tsx`, `src/ui/BottomNav.tsx`(상점 열기), `src/ui/Battle.tsx`, `src/ui/OfflinePopup.tsx`, `src/index.css`, `src/ui/text.ts`(`cooldown`).

- 상점 탭(처음부터 열림): 탭 3개 — **보석 상점**(아이템 6종), **광고 보상**(지면 5종, 남은 쿨다운 표시, 프리미엄이면 "광고 없이 받기"), **VX 상품**(상품 목록, 가격은 `productPrice` 없으면 데이터 값, VIP 단계와 다음 단계까지 VX, 매일 받기 버튼).
- 전투 화면 위쪽에 켜진 버프와 남은 시간(BuffBar).
- 오프라인 팝업에 [광고 보고 한 번 더] 버튼.
- 브라우저 확인(`?local`, 모바일): 보석 버프 구매 → 버프 표시 → 골드 증가 속도 변화; 광고(개발 빌드는 바로 보상) → 쿨다운 표시; 콘솔 오류 없음.

```bash
bash "$TEMP/ship.sh" "feat: shop screen, buff bar and offline ad" src
```

---

### Task 6: VX 대시보드 등록 시트와 문서

**Files:** Create `tools/vx-sheet.ts`(→ `docs/vx-dashboard.md`), 상품 이미지 `docs/vx-images/*.png`(정사각형, Codex). Modify 설계 §6, 로드맵.

- 시트: SKU, 이름 KO/EN, 설명 KO/EN, 가격, 유형, 이미지 경로. `shared/data/shop.ts`에서 생성한다.
- 설계 §6.1(광고는 클라이언트 신뢰 + 서버 쿨다운), §6.2(지면 표), §6.3(상품), §6.4(VIP), 보석 상점, §10.

```bash
bash "$TEMP/ship.sh" "docs: monetization, VX dashboard sheet" docs tools
```

## 6단계 완료 기준

- 테스트, 타입 검사, 서버 테스트 통과, `develop` 푸시
- Task 5 브라우저 확인 통과
- VX 등록 시트와 상품 이미지를 사용자에게 전달
