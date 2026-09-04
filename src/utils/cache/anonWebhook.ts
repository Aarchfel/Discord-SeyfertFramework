import { DatabaseService } from "src/services/database/database";

interface GuildConfigRow {
  guild_id: string;
  anonymous_channel: string | null;
}

let anonCh = new Map<string, string>()

export function loadAnonChCache() {
  const rows  = DatabaseService.getAll<GuildConfigRow>("general", "guild_configs");
  anonCh = new Map(
    rows.filter((r) => r.anonymous_channel).map((r) => [r.anonymous_channel as string, r.guild_id])
  );
}

export function isAnonCh(cId: string): string | undefined {
  return anonCh.get(cId);
}

export function updateAnonChCache(cId: string | null, gId: string, prevCId?: string | null) {
  if (prevCId) anonCh.delete(prevCId);
  if (cId) anonCh.set(cId, gId);
}
