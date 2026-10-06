import type { Intent } from "../../shared/actions";
import { syncSave, type SyncResult } from "../../shared/sync";

// How the client reaches "the server". Step 2 adds a Verse8Transport over remoteFunction("sync").
export interface Transport {
  sync(intents: Intent[]): Promise<SyncResult>;
}

// The server's sync run in the page against browser storage: for local development and tests.
// Same syncSave as the real server, so it plays by the same rules.
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
}

// While there is no connection: every sync fails, so the store keeps the intents queued.
export const OFFLINE: Transport = {
  sync: () => Promise.reject(new Error("offline")),
};
