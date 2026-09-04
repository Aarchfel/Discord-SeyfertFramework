import { LRUCache } from "lru-cache";
import type { UsingClient } from "seyfert";

const invCache = new LRUCache<string, Map<string, number>>({
  max: 500,
  ttl: 30 * 60 * 1000
})

export async function cacheGuildInvites(client: UsingClient, guildId: string) {
  const guild = await client.guilds.fetch(guildId, {force: true}).catch(() => null);
  if (!guild) {
    console.log(`[Invite] guild ${guildId} not found`);
    return;
  };

  // NOTE: FOR DEBUG ONLY
  // console.log(`[Invite] caching invites for guild ${guild.id} typeof i`);

  const invites = await guild.invites.list().catch((err: any) => {
    console.error(`[Invite] Failed to fetch invites for guild ${guild.id}:`, err);
    return "CAUGHT_ERR";
  });

  const inviteList = Array.isArray(invites) ? invites : Object.values(invites ?? {});

  const map = new Map<string, number>();
  for (const inv of inviteList) map.set(inv.code, inv.uses ?? 0);

  // NOTE: FOR DEBUG ONLY
  // console.log(`[Invite] guild ${guild.id} cached ${map.size} codes [${[...map.keys()].join(", ")}]`);
  invCache.set(guild.id, map);
}

export async function resolveUsedInvite(client: UsingClient, guildId: string) {
  const before = invCache.get(guildId) ?? new Map();
  const guild = await client.guilds.fetch(guildId, {force: true}).catch(() => null);
  if (!guild) return;

  const after = await guild.invites.list().catch(() => []);
  const afterList = Array.isArray(after) ? after : Object.values(after ?? {});

  if (afterList.length === 0) {
    await cacheGuildInvites(client, guildId);
    return null;
  }

  for (const inv of afterList) {
    const prevUses = before.get(inv.code) ?? 0;
    if ((inv.uses ?? 0) > prevUses) {
      await cacheGuildInvites(client, guildId); // refresh cache
      return { code: inv.code, uses: inv.uses ?? 0, inviter: inv.inviter ?? null };
    }
  }

  await cacheGuildInvites(client, guildId);
  return null;
}

