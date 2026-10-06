// Builds the VX dashboard registration sheet (docs/vx-dashboard.md) from the product table in
// shared/data/shop.ts, so what is registered never drifts from what the game grants.
// Run: npm run vx-sheet
import { existsSync, writeFileSync } from "node:fs";
import { PRODUCTS, type Product } from "../shared/data/shop";

const KIND_KO: Record<Product["kind"], string> = { repeat: "반복 구매", once: "1회 구매", timed: "반복 구매 (기간 연장)" };

function vxSheet(products: readonly Product[], imageExists: (path: string) => boolean): string {
  const lines = [
    "# VX 대시보드 등록 시트",
    "",
    "`npm run vx-sheet`이 `shared/data/shop.ts`에서 만든다. 직접 고치지 말고 상품 표를 고친 뒤 다시 만든다.",
    "",
    "- SKU는 대시보드의 Product ID와 글자 하나까지 같아야 한다(게임 서버가 이 ID로 지급한다).",
    "- 가격은 대시보드 값이 기준이다. 게임은 대시보드 가격을 읽어 보여주고, 못 읽을 때만 아래 값을 쓴다.",
    "- 이미지는 정사각형 PNG다.",
    "",
    "| SKU | 이름 (KO) | 이름 (EN) | 설명 (KO) | 설명 (EN) | 가격 (VX) | 유형 | 이미지 |",
    "|---|---|---|---|---|---|---|---|",
  ];
  for (const p of products) {
    const img = `art/vx/${p.id}.png`;
    lines.push(`| \`${p.id}\` | ${p.nameKo} | ${p.nameEn} | ${p.textKo} | ${p.textEn} | ${p.vx.toLocaleString("en-US")} | ${KIND_KO[p.kind]} | ${imageExists(img) ? `\`${img}\`` : "(제작 중)"} |`);
  }
  lines.push("");
  return lines.join("\n");
}

writeFileSync("docs/vx-dashboard.md", vxSheet(PRODUCTS, existsSync));
console.log("docs/vx-dashboard.md");
