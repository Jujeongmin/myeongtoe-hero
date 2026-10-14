// Words a nickname may not contain: swearing, slurs and sexual words in the game's languages
// (Korean, English, Japanese, Chinese), and names that pose as the game's staff. A nickname is
// matched with its letters lower-cased and katakana read as hiragana, twice: once with its digits
// dropped (시1발, fu2ck) and once with look-alike digits read as letters (sh1t, b1tch). Nicknames
// allow no spaces or symbols (see readNickname), so those dodges cannot happen.
const WORDS = [
  // 한국어
  "시발", "씨발", "씨빨", "시빨", "씨바", "씨팔", "시팔", "쉬발", "쓰발", "씹", "좆", "좃", "존나",
  "병신", "븅신", "빙신", "등신", "개새", "개색", "새끼", "섀끼", "쌔끼", "미친놈", "미친년", "미친새",
  "닥쳐", "꺼져", "지랄", "염병", "엠창", "느금", "니애미", "니미", "니엄", "애미", "애비", "에미",
  "보지", "자지", "섹스", "썅", "쌍년", "쌍놈", "창녀", "창년", "걸레", "또라이", "똘아이",
  "한남충", "김치녀", "메갈", "일베", "틀딱", "맘충", "급식충", "짱깨", "쪽바리", "깜둥",
  // English
  "fuck", "fack", "fuk", "fck", "phuck", "shit", "bitch", "btch", "cunt", "dick", "cock", "pussy",
  "penis", "vagina", "porn", "sex", "nigger", "nigga", "faggot", "retard", "whore", "slut",
  "bastard", "asshole", "rapist", "nazi", "hitler", "kkk", "wank", "twat", "dildo",
  // 日本語 (hiragana; katakana is read as hiragana)
  "ちんこ", "ちんぽ", "まんこ", "せっくす", "きちがい", "気違い", "れいぷ", "がいじ", "ふぁっく", "くそ",
  "死ね", "殺す", "ころす",
  // 中文 (简体, 繁體)
  "操你", "肏", "傻逼", "傻b", "煞笔", "妈的", "媽的", "他妈", "他媽", "你妈", "你媽", "婊子", "鸡巴",
  "雞巴", "屌", "草泥马", "草泥馬", "去死", "贱人", "賤人", "王八蛋", "狗娘", "日你", "屄", "幹你",
  "干你", "機掰", "机掰", "靠北", "白痴", "白癡", "黑鬼", "支那",
  // Posing as the game's staff
  "운영자", "관리자", "운영팀", "운영진", "개발자", "admin", "gamemaster",
];

const LOOKALIKE: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "9": "g" };

// Katakana (ァ-ヶ) to hiragana, so チンコ is caught as ちんこ.
function hiragana(s: string): string {
  return s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

export function isRude(name: string): boolean {
  const base = hiragana(name.toLowerCase());
  const forms = [base.replace(/[0-9]/g, ""), base.replace(/[0-9]/g, (d) => LOOKALIKE[d] ?? "")];
  return forms.some((form) => WORDS.some((word) => form.includes(word)));
}
