import { applyPurchase, readPurchaseEvent } from "../../shared/purchase";
import { RANKING_SIZE, profileOf, rankRowOf, readAccount, readBoard, readNickname, nicknameError, type PublicProfile, type RankRow, type RankingView } from "../../shared/ranking";
import { fromSave, newState, toSave, type SaveData } from "../../shared/state";
import { syncSave, type SyncResult } from "../../shared/sync";
import { GRANTS, applyGrant, readGrant, type Grant } from "../../shared/grant";
import { PLAYERS, RETENTION_DAYS, VISITS, addDays, churnReport, isAdmin, retentionDays, track, type ChurnReport, type PlayerRow, type RetentionRow } from "../../shared/retention";

// Where the save lives in the account's global user state, and the record last put on the boards.
const SAVE_KEY = "save";
const RANKED_KEY = "ranked";
const RECEIPTS_KEY = "receipts";
const RANKING = "ranking";
const SEEN_KEY = "seen";

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

// A player's row in "players" (its id is the account): updated if there, added if not.
async function writePlayer(row: PlayerRow): Promise<void> {
  try {
    await $global.updateCollectionItem(PLAYERS, { __id: row.account, ...row });
  } catch {
    await $global.addCollectionItem(PLAYERS, { ...row }, { id: row.account });
  }
}

// Every player's row, a page at a time (ordered by account).
async function allPlayers(): Promise<PlayerRow[]> {
  const out: PlayerRow[] = [];
  const PAGE = 500;
  let after: string | undefined;
  for (let page = 0; page < 100; page++) {
    const items = await $global.getCollectionItems(PLAYERS, after === undefined
      ? { orderBy: [{ field: "account", direction: "asc" }], limit: PAGE }
      : { orderBy: [{ field: "account", direction: "asc" }], startAfter: after, limit: PAGE });
    const fresh = items.filter((i) => after === undefined || String(i.account) > after);
    for (const i of fresh) {
      out.push({
        account: String(i.account), first: typeof i.first === "string" ? i.first : null, last: String(i.last ?? ""),
        days: Number(i.days) || 0, floor: Number(i.floor) || 0, step: Number(i.step) || 0,
        prestiges: Number(i.prestiges) || 0, playMin: Number(i.playMin) || 0,
      });
    }
    if (items.length < PAGE || fresh.length === 0) break;
    after = String(items[items.length - 1].account);
  }
  return out;
}

export class Server {
  // The game's one call: settle the save up to the server's clock, apply the player's queued intents
  // in order, store it, and send it back. Under the account's lock so two calls never interleave.
  async sync(intents: unknown): Promise<SyncResult> {
    const account = $sender.account;
    return $lock(`save:${account}`, async () => {
      const userState = await $global.getUserState(account);
      const now = Date.now();
      const result = syncSave(userState?.[SAVE_KEY], intents, now);
      // For the retention table and 이탈 시점: the day's visit (once a day) and where the player is
      // (on a new day and every few minutes of play).
      const save = result.save;
      const seen = track(account, userState?.[SEEN_KEY], !userState?.[SAVE_KEY], { floor: save.bestFloor, step: save.missions.step, prestiges: save.prestiges }, now);
      await $global.updateUserState(account, seen ? { [SAVE_KEY]: save, [SEEN_KEY]: seen.seen } : { [SAVE_KEY]: save });
      if (seen?.visit) await $global.addCollectionItem(VISITS, { ...seen.visit });
      if (seen?.player) await writePlayer(seen.player);
      await updateRanking(account, result.save, userState?.[RANKED_KEY]);
      return result;
    });
  }

  // Verse8 calls this when a VX Shop purchase completes, possibly more than once for the same
  // receipt: each purchaseId pays once, and a repeat still answers success so the platform stops.
  async $onItemPurchased(raw: unknown): Promise<{ success: boolean; code: string }> {
    const event = readPurchaseEvent(raw);
    if (!event) return { success: false, code: "invalid_event" };
    return $lock(`save:${event.account}`, async () => {
      const userState = await $global.getUserState(event.account);
      const out = applyPurchase(userState?.[SAVE_KEY], userState?.[RECEIPTS_KEY], event, Date.now());
      if (out.code === "unknown_product") return { success: false, code: out.code };
      if (out.code === "granted") {
        await $global.updateUserState(event.account, { [SAVE_KEY]: out.save, [RECEIPTS_KEY]: out.receipts });
      }
      return { success: true, code: out.code };
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

  // Someone's profile card, for tapping their row on a board.
  async profile(account: unknown): Promise<PublicProfile> {
    const id = readAccount(account);
    if (!id) throw new Error("bad_account");
    const userState = await $global.getUserState(id);
    const raw = userState?.[SAVE_KEY];
    if (!raw) throw new Error("not_found");
    return profileOf(id, fromSave(raw));
  }

  // 리텐션 (admin accounts only): for each day from the start, the new players, everyone who played,
  // and how many of that day's new players came back 1, 3, 7, 14 and 30 days later.
  async retention(): Promise<{ days: number[]; rows: RetentionRow[] }> {
    if (!isAdmin($sender.account)) throw new Error("forbidden");
    const now = Date.now();
    const today = retentionDays(now).slice(-1)[0];
    const count = (filters: { field: string; operator: "=="; value: unknown }[]) => $global.countCollectionItems(VISITS, { filters });
    const rows = await Promise.all(retentionDays(now).map(async (day) => {
      const [newUsers, active, ...back] = await Promise.all([
        count([{ field: "first", operator: "==", value: day }, { field: "day", operator: "==", value: day }]),
        count([{ field: "day", operator: "==", value: day }]),
        ...RETENTION_DAYS.map((n) => {
          const later = addDays(day, n);
          return later > today ? Promise.resolve(null) : count([{ field: "first", operator: "==", value: day }, { field: "day", operator: "==", value: later }]);
        }),
      ]);
      return { day, newUsers, active, back };
    }));
    return { days: [...RETENTION_DAYS], rows };
  }

  // 운영자 지급 (admin accounts only): 보석, 상품권 or 응시권 into a player's save, under that
  // player's lock like a sync; each grant is also logged in "grants".
  async grant(account: unknown, gift: unknown): Promise<{ account: string; given: Grant; gems: number; coupons: number; tickets: number }> {
    if (!isAdmin($sender.account)) throw new Error("forbidden");
    const id = readAccount(account);
    const given = readGrant(gift);
    if (!id) throw new Error("bad_account");
    if (!given) throw new Error("bad_grant");
    return $lock(`save:${id}`, async () => {
      const userState = await $global.getUserState(id);
      const raw = userState?.[SAVE_KEY];
      if (!raw) throw new Error("not_found");
      const state = applyGrant(fromSave(raw), given);
      await $global.updateUserState(id, { [SAVE_KEY]: toSave(state) });
      await $global.addCollectionItem(GRANTS, { account: id, by: $sender.account, at: Date.now(), ...given });
      return { account: id, given, gems: state.gems, coupons: state.coupons, tickets: state.tickets };
    });
  }

  // 이탈 시점 (admin accounts only): where the new players are and how many in each place have left.
  async churn(): Promise<ChurnReport> {
    if (!isAdmin($sender.account)) throw new Error("forbidden");
    return churnReport(await allPlayers(), Date.now());
  }

  // 2~8 Korean/English letters or digits; saved on the save and shown on the boards.
  async setNickname(name: unknown): Promise<{ nickname: string }> {
    const nickname = readNickname(name);
    if (!nickname) throw new Error(nicknameError(name) ?? "bad_nickname");
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
