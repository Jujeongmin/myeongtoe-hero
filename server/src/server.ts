import { RANKING_SIZE, rankRowOf, readBoard, readNickname, type RankRow, type RankingView } from "../../shared/ranking";
import { fromSave, newState, toSave, type SaveData } from "../../shared/state";
import { syncSave, type SyncResult } from "../../shared/sync";

// Where the save lives in the account's global user state, and the record last put on the boards.
const SAVE_KEY = "save";
const RANKED_KEY = "ranked";
const RANKING = "ranking";

function stripId(item: Record<string, unknown>): RankRow {
  return { account: String(item.account), nickname: String(item.nickname ?? ""), floor: Number(item.floor) || 0, depth: Number(item.depth) || 0 };
}

// The account's row on the boards: written when its save's record is above what was last written
// (kept in user state, so a sync does not have to read the collection every time).
async function updateRanking(account: string, save: SaveData, ranked: unknown, force = false): Promise<void> {
  const last = (ranked ?? {}) as { floor?: number; depth?: number };
  if (!force && save.bestFloor <= (last.floor ?? 0) && save.parking.best <= (last.depth ?? 0)) return;
  const row = rankRowOf(account, save);
  const [stored] = await $global.getCollectionItems(RANKING, { filters: [{ field: "account", operator: "==", value: account }], limit: 1 });
  if (stored) await $global.updateCollectionItem(RANKING, { __id: stored.__id, ...row });
  else await $global.addCollectionItem(RANKING, { ...row });
  await $global.updateUserState(account, { [RANKED_KEY]: { floor: row.floor, depth: row.depth } });
}

export class Server {
  // The game's one call: settle the save up to the server's clock, apply the player's queued intents
  // in order, store it, and send it back. Under the account's lock so two calls never interleave.
  async sync(intents: unknown): Promise<SyncResult> {
    const account = $sender.account;
    return $lock(`save:${account}`, async () => {
      const userState = await $global.getUserState(account);
      const result = syncSave(userState?.[SAVE_KEY], intents, Date.now());
      await $global.updateUserState(account, { [SAVE_KEY]: result.save });
      await updateRanking(account, result.save, userState?.[RANKED_KEY]);
      return result;
    });
  }

  // A board, best first, and the caller's own row.
  async ranking(board: unknown): Promise<RankingView> {
    const account = $sender.account;
    const b = readBoard(board) ?? "floor";
    const items = await $global.getCollectionItems(RANKING, { orderBy: [{ field: b, direction: "desc" }], limit: RANKING_SIZE });
    const [mine] = await $global.getCollectionItems(RANKING, { filters: [{ field: "account", operator: "==", value: account }], limit: 1 });
    return { board: b, rows: items.map(stripId), mine: mine ? stripId(mine) : null };
  }

  // 2~8 Korean/English letters or digits; saved on the save and shown on the boards.
  async setNickname(name: unknown): Promise<{ nickname: string }> {
    const nickname = readNickname(name);
    if (!nickname) throw new Error("bad_nickname");
    const account = $sender.account;
    return $lock(`save:${account}`, async () => {
      const userState = await $global.getUserState(account);
      const raw = userState?.[SAVE_KEY];
      const state = raw ? fromSave(raw) : newState(Date.now());
      state.nickname = nickname;
      const save = toSave(state);
      await $global.updateUserState(account, { [SAVE_KEY]: save });
      await updateRanking(account, save, userState?.[RANKED_KEY], true);
      return { nickname };
    });
  }
}
