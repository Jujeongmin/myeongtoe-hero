import type { Intent } from "../../shared/actions";
import { profileOf, rankRowOf, readNickname, type Board, type PublicProfile, type RankingView } from "../../shared/ranking";
import { fromSave, toSave } from "../../shared/state";
import { syncSave, type SyncResult } from "../../shared/sync";

// How the client reaches "the server": the game's sync, the boards and nickname changes.
export interface Transport {
  sync(intents: Intent[]): Promise<SyncResult>;
  ranking(board: Board): Promise<RankingView>;
  profile(account: string): Promise<PublicProfile>;
  setNickname(name: string): Promise<{ nickname: string }>;
}

// The server's sync run in the page against browser storage: for local development and tests.
// Same syncSave as the real server, so it plays by the same rules. Its boards hold only this player.
export class LocalTransport implements Transport {
  constructor(
    private readonly storage: Pick<Storage, "getItem" | "setItem">,
    private readonly clock: () => number = Date.now,
    private readonly key = "myeongtoe-hero:save",
  ) {}

  async sync(intents: Intent[]): Promise<SyncResult> {
    const raw = this.storage.getItem(this.key);
    const result = syncSave(raw ? JSON.parse(raw) : undefined, intents, this.clock());
    this.storage.setItem(this.key, JSON.stringify(result.save));
    return result;
  }

  async ranking(board: Board): Promise<RankingView> {
    const raw = this.storage.getItem(this.key);
    const mine = raw ? rankRowOf("local", fromSave(JSON.parse(raw))) : null;
    return { board, rows: mine ? [mine] : [], mine };
  }

  async profile(account: string): Promise<PublicProfile> {
    const raw = this.storage.getItem(this.key);
    if (!raw) throw new Error("not_found");
    return profileOf(account, fromSave(JSON.parse(raw)));
  }

  async setNickname(name: string): Promise<{ nickname: string }> {
    const nickname = readNickname(name);
    if (!nickname) throw new Error("bad_nickname");
    const raw = this.storage.getItem(this.key);
    if (raw) {
      const state = fromSave(JSON.parse(raw));
      state.nickname = nickname;
      this.storage.setItem(this.key, JSON.stringify(toSave(state)));
    }
    return { nickname };
  }
}

// While there is no connection: every call fails, so the store keeps the intents queued.
export const OFFLINE: Transport = {
  sync: () => Promise.reject(new Error("offline")),
  ranking: () => Promise.reject(new Error("offline")),
  profile: () => Promise.reject(new Error("offline")),
  setNickname: () => Promise.reject(new Error("offline")),
};
