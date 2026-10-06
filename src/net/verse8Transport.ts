import type { Intent } from "../../shared/actions";
import type { Board, RankingView } from "../../shared/ranking";
import type { SyncResult } from "../../shared/sync";
import type { Transport } from "./transport";

// A call the server never answers gives up after this long, so the store can queue and retry.
export const CALL_TIMEOUT_MS = 15_000;

// The part of @agent8/gameserver's GameServer this needs (also what tests stand in for).
export interface RemoteCaller {
  remoteFunction(fn: string, args?: unknown[]): Promise<unknown>;
}

export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (value) => {
        clearTimeout(id);
        resolve(value);
      },
      (error) => {
        clearTimeout(id);
        reject(error);
      },
    );
  });
}

function isSyncResult(x: unknown): x is SyncResult {
  const r = x as SyncResult | null;
  return !!r && typeof r === "object" && typeof r.now === "number" && !!r.save && Array.isArray(r.rejected);
}

// The real server: server/src/server.ts's sync, over Verse8's remoteFunction.
export class Verse8Transport implements Transport {
  constructor(private readonly server: RemoteCaller, private readonly timeoutMs = CALL_TIMEOUT_MS) {}

  async sync(intents: Intent[]): Promise<SyncResult> {
    const reply = await withTimeout(this.server.remoteFunction("sync", [intents]), this.timeoutMs);
    if (!isSyncResult(reply)) throw new Error("bad_reply");
    return reply;
  }

  async ranking(board: Board): Promise<RankingView> {
    const reply = (await withTimeout(this.server.remoteFunction("ranking", [board]), this.timeoutMs)) as RankingView | null;
    if (!reply || !Array.isArray(reply.rows)) throw new Error("bad_reply");
    return reply;
  }

  async setNickname(name: string): Promise<{ nickname: string }> {
    const reply = (await withTimeout(this.server.remoteFunction("setNickname", [name]), this.timeoutMs)) as { nickname?: unknown } | null;
    if (!reply || typeof reply.nickname !== "string") throw new Error("bad_reply");
    return { nickname: reply.nickname };
  }
}
