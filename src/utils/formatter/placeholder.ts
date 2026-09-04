import type { Client, Guild, GuildMember, User } from 'seyfert';

export interface PlaceholderContext {
  client?: Client<any>;
  member?: GuildMember;
  user?: User;
  guild?: Guild<any>;
  channelId?: string;
  channelName?: string;

  inviter?: { id: string; username: string } | null;
  inviteCode?: string | null;
  inviteUses?: number | null;

  moderator?: User;
  reason?: string;
  caseId?: number | string;

  extra?: Record<string, string>;
}

type Resolver = (
  ctx: PlaceholderContext,
) => Promise<string | null> | string | null;

async function ensureUser(
  c: PlaceholderContext,
): Promise<User | GuildMember | null> {
  if (c.user) return c.user;
  if (c.member?.user) return c.member.user;

  const tgId = c.member?.id;
  if (tgId && c.member?.id) {
    const fetched = await c.client?.users.fetch(tgId).catch(() => null);
    if (fetched) {
      c.user = fetched;
      return fetched;
    }
  }

  return c.member ?? null;
}

const resolvers: Record<string, Resolver> = {
  // User / Member
  username: async (c) => {
    const target = await ensureUser(c);
    return target?.username ?? (c.member as any)?.username ?? null;
  },
  globalname: async (c) => {
    const target = await ensureUser(c);
    return (target as User)?.globalName ?? target?.username ?? null;
  },
  displayname: async (c) => {
    const target = await ensureUser(c);
    return (
      (c.member as GuildMember)?.displayName ??
      (target as User)?.globalName ??
      target?.username ??
      null
    );
  },
  tag: async (c) => {
    const target = await ensureUser(c);
    return (
      (target as any)?.tag ?? (target?.username ? `${target.username}#0` : null)
    );
  },
  mention: (c) =>
    (c.member?.id ?? c.user?.id) ? `<@${c.member?.id ?? c.user?.id}>` : null,
  id: (c) => c.member?.id ?? c.user?.id ?? null,
  avatar: async (c) => {
    const target = await ensureUser(c);
    return (target as User)?.avatarURL?.() ?? c.member?.avatarURL?.() ?? null;
  },
  bot: async (c) => {
    const target = await ensureUser(c);
    if (!target) return 'No';
    return (target as User).bot ? 'Yes' : 'No';
  },
  accountcreated: (c) => {
    const id = c.member?.id ?? c.user?.id;
    if (!id) return null;
    const ts = Math.floor(Number((BigInt(id) >> 22n) + 1420070400000n) / 1000);
    return `<t:${ts}:F>`;
  },
  accountage: (c) => {
    const id = c.member?.id ?? c.user?.id;
    if (!id) return null;
    const ts = Math.floor(Number((BigInt(id) >> 22n) + 1420070400000n) / 1000);
    return `<t:${ts}:R>`;
  },
  joindate: (c) =>
    c.member?.joinedAt
      ? `<t:${Math.floor(new Date(c.member.joinedAt).getTime() / 1000)}:F>`
      : null,

  // Guild / Server
  server: (c) => c.guild?.name ?? null,
  serverid: (c) => c.guild?.id ?? null,
  servericon: (c) => c.guild?.iconURL?.({ size: 1024 }) ?? null,
  serverbanner: (c) => c.guild?.bannerURL?.({ size: 1024 }) ?? null,
  membercount: (c) => c.guild?.memberCount?.toLocaleString() ?? null,
  boostcount: (c) => c.guild?.premiumSubscriptionCount?.toString() ?? null,
  boostlevel: (c) => c.guild?.premiumTier?.toString() ?? null,

  // Invite Tracking
  inviter: (c) => c.inviter?.username ?? null,
  invitermention: (c) => (c.inviter ? `<@${c.inviter.id}>` : null),
  invitecode: (c) => c.inviteCode ?? null,
  inviteuses: (c) =>
    c.inviteUses !== undefined && c.inviteUses !== null
      ? c.inviteUses.toString()
      : null,

  // Moderation
  moderator: (c) => c.moderator?.username ?? null,
  modmention: (c) => (c.moderator ? `<@${c.moderator.id}>` : null),
  reason: (c) => c.reason ?? null,
  caseid: (c) => (c.caseId !== undefined ? c.caseId.toString() : null),

  // Channel
  channel: (c) => (c.channelId ? `#${c.channelId}` : (c.channelName ?? null)),
  channelid: (c) => c.channelId ?? null,

  // Misc / Time
  timestamp: () => `<t:${Math.floor(Date.now() / 1000)}:F>`,
  relativetime: () => `<t:${Math.floor(Date.now() / 1000)}:R>`,
  separator: () => '{separator}',
};

const placeholderRegex = /\{(\w+)\}/g;

export async function resolvePlaceholder(
  template: string,
  ctx: PlaceholderContext,
): Promise<string> {
  const matches = Array.from(template.matchAll(placeholderRegex));
  if (matches.length === 0) return template;

  let result = template;

  for (const match of matches) {
    const rawMatch = match[0];
    const key = match[1];
    const lower = key.toLowerCase();

    if (ctx.extra && lower in ctx.extra) {
      result = result.replace(rawMatch, ctx.extra[lower]);
      continue;
    }

    const resolver = resolvers[lower];
    if (!resolver) continue;

    const val = await resolver(ctx);
    result = result.replace(rawMatch, val ?? '`Unknown`');
  }

  return result;
}

export function listAvailablePlaceholders() {
  return Object.keys(resolvers).map((k) => `{${k}}`);
}
