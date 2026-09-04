import {
  APIAuditLogEntry,
  ChannelType,
  Formatter,
  PermissionFlagsBits,
} from 'seyfert';
import { AuditChange } from '../card/auditlogCard';

const epoch = 1420070400000n;

// THINGS

export const verificationLevelLabel: Record<number, string> = {
  0: 'None',
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Highest',
};

export const explicitFilterLabel: Record<number, string> = {
  0: 'Disabled',
  1: 'Members Without Roles',
  2: 'All Members',
};

export const mfaLevelLabel: Record<number, string> = {
  0: 'None',
  1: 'Required',
};

export const nsfwLevelLabel: Record<number, string> = {
  0: 'Disabled',
  1: 'Explicit',
  2: 'Safe',
  3: 'Age Restricted',
};

export function formatChannelType(type: ChannelType): string {
  switch (type) {
    case ChannelType.GuildText:
      return '`💬 Text Channel`';

    case ChannelType.GuildVoice:
      return '`🔊 Voice Channel`';

    case ChannelType.GuildCategory:
      return '`📂 Category`';

    case ChannelType.GuildAnnouncement:
      return '`📣 Announcement Channel`';

    case ChannelType.GuildStageVoice:
      return '`🎉 Stage Channel`';

    case ChannelType.GuildForum:
      return '`📝 Forum Channel`';

    case ChannelType.GuildMedia:
      return '`🖼️ Media Channel`';

    default:
      return '`📍 Unknown / Other`';
  }
}

export function snowflakeToDate(id: string): Date {
  const ms = (BigInt(id) >> 22n) + epoch;
  return new Date(Number(ms));
}

const newAccThres = 7 * 24 * 60 * 60 * 1000;

export function isNewAccount(id: string): boolean {
  return Date.now() - snowflakeToDate(id).getTime() < newAccThres;
}

export function accountAgeLabel(id: string): string {
  const ms = Date.now() - snowflakeToDate(id).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days < 1) return '< 1 day';
  if (days === 1) return '1 day';
  return `${days} days`;
}

export function discordTimestamp(
  date: Date,
  style: 'F' | 'R' | 'f' | 'd' = 'F',
): string {
  return `<t:${Math.floor(date.getTime() / 1000)}:${style}>`;
}

export function truncate(text: string, max = 500): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}...`;
}

export function diffKeys<T extends Record<string, unknown>>(
  before: T,
  after: T,
): (keyof T)[] {
  const keys = new Set<keyof T>([
    ...Object.keys(before),
    ...Object.keys(after),
  ] as (keyof T)[]);
  const changed: (keyof T)[] = [];

  for (const key of keys) {
    if (before[key] !== after[key]) changed.push(key);
  }

  return changed;
}

export function sanitizeCodeblock(text: string): string {
  if (!text) return text;
  return text.replace(/`/g, '`');
}

export function buildOverwriteChange(
  entry: any,
  gId: string,
): AuditChange | null {
  const opts = entry.options ?? {};
  const targetId: string | undefined = opts.id;
  if (!targetId) return null;

  const type = Number(opts.type ?? 0);
  let label: string;
  if (targetId === gId) {
    label = '@everyone';
  } else {
    label =
      type === 1
        ? Formatter.userMention(targetId)
        : Formatter.roleMention(targetId);
  }

  const find = (key: 'allow' | 'deny', which: 'old_value' | 'new_value') =>
    (entry.changes ?? []).find((c: any) => c.key === key)?.[which];

  const befAllow = BigInt(find('allow', 'old_value') ?? 0);
  const aftAllow = BigInt(find('allow', 'new_value') ?? 0);
  const befDeny = BigInt(find('deny', 'old_value') ?? 0);
  const aftDeny = BigInt(find('deny', 'new_value') ?? 0);

  const lines: string[] = [];

  for (const [perm, bitVal] of Object.entries(PermissionFlagsBits)) {
    const bit = BigInt(bitVal as any);
    const wasAllow = (befAllow & bit) === bit;
    const wasDeny = (befDeny & bit) === bit;
    const isAllow = (aftAllow & bit) === bit;
    const isDeny = (aftDeny & bit) === bit;

    if (wasAllow === isAllow && wasDeny === isDeny) continue;

    if (isAllow && !wasAllow) lines.push(`+ ${perm}`);
    else if (isDeny && !wasDeny) lines.push(`- ${perm}`);
    else if (!isAllow && !isDeny && (wasAllow || wasDeny))
      lines.push(`# ${perm} (reset to default)`);
  }

  if (!lines.length) return null;
  return { type: 'permOverwrite', text: label, permLines: lines };
}

export function buildRolePermsChange(
  ent: APIAuditLogEntry,
): AuditChange | null {
  const change = ent.changes?.find((c: any) => c.key === 'permissions');
  if (!change) return null;

  const bef = BigInt((change.old_value as string | number) ?? 0);
  const aft = BigInt((change.new_value as string | number) ?? 0);
  const lines: string[] = [];

  for (const [perm, bitVal] of Object.entries(PermissionFlagsBits)) {
    const bit = BigInt(bitVal as any);
    const wasGranted = (bef & bit) === bit;
    const isGranted = (aft & bit) === bit;

    if (wasGranted === isGranted) continue;

    if (isGranted && !wasGranted) lines.push(`+ ${perm}`);
    else if (!isGranted && wasGranted) lines.push(`- ${perm}`);
  }

  if (!lines.length) return null;
  return {
    type: 'permOverwrite',
    text: 'Permission Granted',
    permLines: lines,
  };
}

/*
export function buildRolePermsChange(ent: any): AuditChange | null {
  const change = (ent.changes ?? []).find((c: any) => c.key === 'permissions');
  if (!change?.new_value) return null;

  const granted = BigInt(change.new_value);
  const lines: string[] = [];

  for (const [perm, bitVal] of Object.entries(PermissionFlagsBits)) {
    const bit = BigInt(bitVal as any);
    if ((granted & bit) === bit) lines.push(`+ ${perm}`);
  }

  if (!lines.length) return null;
  return {
    type: 'permOverwrite',
    text: 'Permission Granted',
    permLines: lines,
  };
}
*/
