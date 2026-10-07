# VX 대시보드 등록 시트

`npm run vx-sheet`이 `shared/data/shop.ts`에서 만든다. 직접 고치지 말고 상품 표를 고친 뒤 다시 만든다.

- SKU는 대시보드의 Product ID와 글자 하나까지 같아야 한다(게임 서버가 이 ID로 지급한다).
- 가격은 대시보드 값이 기준이다. 게임은 대시보드 가격을 읽어 보여주고, 못 읽을 때만 아래 값을 쓴다.
- 이미지는 정사각형 PNG다.

| SKU | 이름 (KO) | 이름 (EN) | 설명 (KO) | 설명 (EN) | 가격 (VX) | 유형 | 이미지 |
|---|---|---|---|---|---|---|---|
| `gems_xs` | 보석 한 줌 | Gem Handful | 보석 120개 | 120 gems | 100 | 반복 구매 | `art/vx/gems_xs.png` |
| `gems_s` | 보석 주머니 | Gem Pouch | 보석 650개 | 650 gems | 500 | 반복 구매 | `art/vx/gems_s.png` |
| `gems_m` | 보석 봉투 | Gem Envelope | 보석 1,400개 | 1,400 gems | 1,000 | 반복 구매 | `art/vx/gems_m.png` |
| `gems_l` | 보석 서류가방 | Gem Briefcase | 보석 4,500개 | 4,500 gems | 3,000 | 반복 구매 | `art/vx/gems_l.png` |
| `gems_xl` | 보석 금고 | Gem Safe | 보석 8,000개 | 8,000 gems | 5,000 | 반복 구매 | `art/vx/gems_xl.png` |
| `gems_xxl` | 보석 본사 금고 | Gem HQ Vault | 보석 17,000개 | 17,000 gems | 10,000 | 반복 구매 | `art/vx/gems_xxl.png` |
| `pack_rookie` | 신입 패키지 | Rookie Pack | 시작 7일 안 1회: 보석 1,000, 응시권 5,000, 상품권 300, 버프 3종 30분 | Once, within 7 days of starting: 1,000 gems, 5,000 exam tickets, 300 coupons, all 3 buffs for 30 min | 500 | 1회 구매 | `art/vx/pack_rookie.png` |
| `premium` | 프리미엄 | Premium | 광고 없이 보상, 버프 3종 항상 켜짐, 오프라인 +4시간, 매일 보석 100 | Ad rewards without ads, all 3 buffs always on, +4 h offline, 100 gems daily | 1,000 | 1회 구매 | `art/vx/premium.png` |
| `pass_salary` | 월급 통장 | Salary Account | 30일 동안 매일 보석 300, 광고 쿨다운 절반 (다시 사면 30일 연장) | 300 gems daily and half ad cooldowns for 30 days (buying again adds 30 days) | 1,000 | 반복 구매 (기간 연장) | `art/vx/pass_salary.png` |
| `pack_promo_100` | 승진 패키지 100층 | Promotion Pack 100F | 100층 도달 기념: 보석 500, 응시권 1000, 상품권 200 | For reaching floor 100: 500 gems, 1000 exam tickets, 200 coupons | 500 | 1회 구매 | `art/vx/pack_promo_100.png` |
| `pack_promo_300` | 승진 패키지 300층 | Promotion Pack 300F | 300층 도달 기념: 보석 1000, 응시권 30000, 상품권 400 | For reaching floor 300: 1000 gems, 30000 exam tickets, 400 coupons | 1,000 | 1회 구매 | `art/vx/pack_promo_300.png` |
| `pack_promo_500` | 승진 패키지 500층 | Promotion Pack 500F | 500층 도달 기념: 보석 1500, 응시권 300000, 상품권 600 | For reaching floor 500: 1500 gems, 300000 exam tickets, 600 coupons | 1,500 | 1회 구매 | `art/vx/pack_promo_500.png` |
| `pack_promo_1000` | 승진 패키지 1000층 | Promotion Pack 1000F | 1000층 도달 기념: 보석 2000, 응시권 5000000, 상품권 1000 | For reaching floor 1000: 2000 gems, 5000000 exam tickets, 1000 coupons | 2,000 | 1회 구매 | `art/vx/pack_promo_1000.png` |
