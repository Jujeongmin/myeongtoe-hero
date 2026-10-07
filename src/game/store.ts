import { applyIntent, RuleError, type Intent } from "../../shared/actions";
import type { Board, RankingView } from "../../shared/ranking";
import { settle } from "../../shared/settle";
import { fromSave, type GameState } from "../../shared/state";
import type { OfflineReport } from "../../shared/sync";
import type { Transport } from "../net/transport";

// The client's copy of the game: the last state the server confirmed, plus what the player has done
// since (in flight, then pending), replayed on top so a tap shows at once. The server's answer
// always wins.
export class GameStore {
  static readonly HEARTBEAT_MS = 10_000;

  // The last message for the toast: a turned-down action's code, or a plain line of text.
  error: { code: string; text?: string; at: number } | null = null;
  // What the last sync said happened while the player was away, until the popup is closed.
  offline: OfflineReport | null = null;
  private confirmed: GameState | null = null;
  private pending: Intent[] = [];
  private inFlight: Intent[] = [];
  private offset = 0;
  private lastSyncAt = Number.NEGATIVE_INFINITY;
  private busy = false;
  private readonly listeners = new Set<() => void>();

  constructor(private transport: Transport, private readonly clock: () => number = Date.now) {}

  // The way to the server changed (connected, dropped, reconnected). Queued intents stay queued.
  setTransport(transport: Transport): void {
    this.transport = transport;
  }

  // Whether any sync has come back yet.
  synced(): boolean {
    return this.confirmed !== null;
  }

  serverNow(): number {
    return this.clock() + this.offset;
  }

  view(): GameState | null {
    if (!this.confirmed) return null;
    let s = settle(this.confirmed, this.serverNow());
    for (const intent of [...this.inFlight, ...this.pending]) {
      try {
        s = applyIntent(s, intent);
      } catch (error) {
        if (!(error instanceof RuleError)) throw error;
      }
    }
    return s;
  }

  do(intent: Intent): boolean {
    const now = this.view();
    if (!now) return false;
    try {
      applyIntent(now, intent);
    } catch (error) {
      if (!(error instanceof RuleError)) throw error;
      this.error = { code: error.code, at: this.clock() };
      this.emit();
      return false;
    }
    this.pending.push(intent);
    this.emit();
    return true;
  }

  async flush(): Promise<void> {
    if (this.busy) return;
    if (this.pending.length === 0 && this.clock() - this.lastSyncAt < GameStore.HEARTBEAT_MS) return;
    this.busy = true;
    this.inFlight = this.pending;
    this.pending = [];
    try {
      const result = await this.transport.sync(this.inFlight);
      this.confirmed = fromSave(result.save);
      if (result.offline) this.offline = result.offline;
      this.offset = result.now - this.clock();
      this.lastSyncAt = this.clock();
      this.inFlight = [];
    } catch (error) {
      this.pending = [...this.inFlight, ...this.pending];
      this.inFlight = [];
      throw error;
    } finally {
      this.busy = false;
      this.emit();
    }
  }

  // Shows a line of text in the toast (no action involved).
  notify(text: string): void {
    this.error = { code: "", text, at: this.clock() };
    this.emit();
  }

  dismissOffline(): void {
    this.offline = null;
    this.emit();
  }

  ranking(board: Board): Promise<RankingView> {
    return this.transport.ranking(board);
  }

  // Syncs now rather than at the next heartbeat (a VX purchase has just been paid on the server).
  async syncNow(): Promise<void> {
    this.lastSyncAt = Number.NEGATIVE_INFINITY;
    await this.flush();
  }

  // The new name is saved by the server; sync at once so the screen shows it.
  async setNickname(name: string): Promise<void> {
    await this.transport.setNickname(name);
    this.lastSyncAt = Number.NEGATIVE_INFINITY;
    await this.flush();
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }
}
