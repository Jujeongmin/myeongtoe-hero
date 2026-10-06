import { syncSave, type SyncResult } from "../../shared/sync";

// Where the save lives in the account's global user state.
const SAVE_KEY = "save";

export class Server {
  // The game's one call: settle the save up to the server's clock, apply the player's queued intents
  // in order, store it, and send it back. Under the account's lock so two calls never interleave.
  async sync(intents: unknown): Promise<SyncResult> {
    const account = $sender.account;
    return $lock(`save:${account}`, async () => {
      const userState = await $global.getUserState(account);
      const result = syncSave(userState?.[SAVE_KEY], intents, Date.now());
      await $global.updateUserState(account, { [SAVE_KEY]: result.save });
      return result;
    });
  }
}
