import { actionSfx } from "./audio";
import { applyIntent, RuleError, type Intent } from "../../shared/actions";
import type { Board, PublicProfile, RankingView } from "../../shared/ranking";
import { settle } from "../../shared/settle";
import { fromSave, type GameState } from "../../shared/state";
import type { OfflineReport } from "../../shared/sync";
import type { Transport } from "../net/transport";

// The client's copy of the game: the last state the server confirmed, plus what the player has done
// since (in flight, then pending), replayed on top so a tap shows at once. The server's answer
// always wins. Each intent is replayed at the moment it was made: replayed at "now" on every redraw,
// a 보스 도전 waiting for the server would start the boss walking in again four times a second.
// The game clock's pace while it catches up after a slow sync (75% speed), and the gap past which
// it just jumps (the device clock was changed).
const SLEW = 0.25;
const SNAP_MS = 5_000;

type Timed = { intent: Intent; at: number };

export class GameStore {
  static readonly HEARTBEAT_MS = 10_000;

  // The last message for the toast: a turned-down action's code, or a plain line of text.
  error: { code: string; text?: string; at: number } | null = null;
  // What the last sync said happened while the player was away, until the popup is closed.
  offline: OfflineReport | null = null;
  private confirmed: GameState | null = null;
  private pending: Timed[] = [];
  private inFlight: Timed[] = [];
  // Server clock minus ours. A sync that came back slower than the last makes it smaller; the game
  // clock then runs a little slow until it has caught up (see serverNow), never backwards.
  private offset = 0;
  private offsetGoal = 0;
  private lastRead = Number.NaN;
  private lastSyncAt = Number.NEGATIVE_INFINITY;
  private clockSet = false;
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
    const now = this.clock();
    if (this.offset > this.offsetGoal) {
      const ran = Number.isNaN(this.lastRead) ? 0 : Math.max(0, now - this.lastRead);
      this.offset = Math.max(this.offsetGoal, this.offset - ran * SLEW);
    }
    this.lastRead = now;
    return now + this.offset;
  }

  view(): GameState | null {
    if (!this.confirmed) return null;
    let s = this.confirmed;
    for (const { intent, at } of [...this.inFlight, ...this.pending]) {
      try {
        s = applyIntent(settle(s, at), intent);
      } catch (error) {
        if (!(error instanceof RuleError)) throw error;
      }
    }
    return settle(s, this.serverNow());
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
    this.pending.push({ intent, at: now.lastTick });
    actionSfx(intent.k);
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
      const sent = this.clock();
      const result = await this.transport.sync(this.inFlight.map(({ intent, at }) => ({ ...intent, at })));
      this.confirmed = fromSave(result.save);
      if (result.offline) this.offline = result.offline;
      // The server answered about halfway through the round trip.
      const offset = result.now - (sent + this.clock()) / 2;
      this.serverNow(); // the slew so far, up to this moment
      this.offsetGoal = offset;
      if (offset > this.offset || this.offset - offset > SNAP_MS || !this.clockSet) this.offset = offset;
      this.clockSet = true;
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

  profile(account: string): Promise<PublicProfile> {
    return this.transport.profile(account);
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
