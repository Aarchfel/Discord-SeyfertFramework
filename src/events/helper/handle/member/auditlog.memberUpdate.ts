import {
  AuditLogEvent,
  ButtonStyle,
  Client,
  Formatter,
  type GuildMember,
} from 'seyfert';
import { AuditEvents } from 'src/utils/auditlog/auditEvents';
import { dispatchAuditlog } from 'src/utils/auditlog/dispatch';
import { isFresh } from 'src/utils/auditlog/importantFunc';
import { AuditButtonDef, AuditField } from 'src/utils/card/auditlogCard';
import { delayDefaultTime, sleep } from 'src/utils/delay';
import { discordTimestamp, snowflakeToDate } from 'src/utils/formatter/label';

async function fetchAudit(
  client: Client<true>,
  gId: string,
  tId: string,
  actType: AuditLogEvent,
): Promise<string | undefined> {
  await sleep(delayDefaultTime);
  try {
    const auditlog = await client.proxy.guilds(gId)['audit-logs'].get({
      query: {
        limit: 10,
        action_type: actType,
      },
    });

    const entrs = auditlog?.audit_log_entries ?? [];
    const ent = entrs.find((e) => e.target_id === tId && isFresh(e.id));
    if (ent?.user_id) {
      return `${Formatter.userMention(ent.user_id)} (\`${ent.user_id}\`)`;
    }
  } catch (e) {
    console.error(e);
  }
  return undefined;
}

function guildAvatar(
  gId: string,
  uId: string,
  hash: string | null | undefined,
) {
  if (!hash) return null;
  const ext = hash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/guilds/${gId}/users/${uId}/avatars/${hash}.${ext}`;
}

export async function handleAuditLogMemberUpdate(
  mem: GuildMember,
  oMem: GuildMember | undefined,
  client: Client<true>,
) {
  if (!oMem) return;

  const user = mem.user;
  const tgTag = `${Formatter.userMention(user.id)} - ${user.username} (\`${user.id}\`)`;
  const createdAt = snowflakeToDate(user.id);
  const baseBtn: AuditButtonDef[] = [
    {
      label: 'View User',
      style: ButtonStyle.Link,
      url: `https://discord.com/users/${user.id}`,
    },
    {
      label: 'Copy UserID',
      style: ButtonStyle.Secondary,
      customId: `copyid_${user.id}`,
    },
  ];

  const baseField: AuditField[] = [
    {
      label: 'User Created At',
      value: `${discordTimestamp(createdAt, 'F')} (${discordTimestamp(createdAt, 'R')})`,
    },
  ];

  const nickChange = mem.nick !== oMem.nick;

  const beforeT = oMem.communicationDisabledUntil
    ? new Date(oMem.communicationDisabledUntil)
    : null;
  const afterT = mem.communicationDisabledUntil
    ? new Date(mem.communicationDisabledUntil)
    : null;
  const timeoutChange = beforeT?.getTime() !== afterT?.getTime();

  let memUpAct: string | undefined;
  if (nickChange || timeoutChange) {
    memUpAct = await fetchAudit(
      client,
      mem.guildId,
      mem.id,
      AuditLogEvent.MemberUpdate,
    );
  }

  if (nickChange) {
    await dispatchAuditlog(client, mem.guildId, AuditEvents.guildMemberUpdate, {
      targetTag: tgTag,
      actorTag: memUpAct,
      fields: baseField,
      changes: [
        {
          type: 'edit',
          text: 'Nickname Changed',
          before: oMem.nick ?? '*(None)*',
          after: mem.nick ?? '*(None)*',
        },
      ],
      buttons: baseBtn,
    });
  }

  if (timeoutChange) {
    const wasActv = !!beforeT && beforeT.getTime() > Date.now();
    const isActv = !!afterT && afterT.getTime() > Date.now();
    const action =
      !wasActv && isActv
        ? 'Timeout Applied'
        : wasActv && !isActv
          ? 'Timeout Removed'
          : 'Timeout Changed';

    await dispatchAuditlog(client, mem.guildId, AuditEvents.guildMemberUpdate, {
      targetTag: tgTag,
      actorTag: memUpAct,
      fields: baseField,
      changes: [
        {
          type: 'edit',
          text: action,
          before: beforeT ? `${discordTimestamp(beforeT, 'F')}` : 'N/A',
          after: afterT ? `${discordTimestamp(afterT, 'F')}` : 'N/A',
        },
      ],
      buttons: isActv
        ? [
            ...baseBtn,
            {
              label: 'Remove Timeout',
              style: ButtonStyle.Danger,
              customId: `removetimeout_${user.id}`,
            },
          ]
        : baseBtn,
    });
  }

  const befRole = new Set('roles' in oMem ? oMem.roles.keys : []);
  const aftRole = new Set('roles' in mem ? mem.roles.keys : []);
  const added = [...aftRole].filter((r) => !befRole.has(r));
  const removed = [...befRole].filter((r) => !aftRole.has(r));

  if (added.length || removed.length) {
    const roleAct = await fetchAudit(
      client,
      mem.guildId,
      mem.id,
      AuditLogEvent.MemberRoleUpdate,
    );

    await dispatchAuditlog(client, mem.guildId, AuditEvents.guildMemberUpdate, {
      targetTag: tgTag,
      actorTag: roleAct,
      fields: baseField,
      changes: [
        ...added.map((r) => ({
          type: 'add' as const,
          text: `Role: ${Formatter.roleMention(r)}`,
        })),
        ...removed.map((r) => ({
          type: 'remove' as const,
          text: `Role: ${Formatter.roleMention(r)}`,
        })),
      ],
      buttons: baseBtn,
    });
  }

  if (mem.avatar !== oMem.avatar) {
    await dispatchAuditlog(client, mem.guildId, AuditEvents.guildMemberUpdate, {
      targetTag: tgTag,
      fields: baseField,
      changes: [
        {
          type: 'image',
          text: 'Server Avatar',
          beforeUrl: guildAvatar(mem.guildId, mem.id, oMem.avatar),
          afterUrl: guildAvatar(mem.guildId, mem.id, mem.avatar),
        },
      ],
      buttons: baseBtn,
    });
  }

  const befBoost = oMem.premiumSince ? new Date(oMem.premiumSince) : null;
  const aftBoost = mem.premiumSince ? new Date(mem.premiumSince) : null;

  if (befBoost?.getTime() !== aftBoost?.getTime()) {
    await dispatchAuditlog(client, mem.guildId, AuditEvents.guildMemberUpdate, {
      targetTag: tgTag,
      fields: baseField,
      changes: [
        {
          type: 'note',
          text: aftBoost
            ? `Started Boosting since ${discordTimestamp(aftBoost, 'F')}`
            : 'Stopped Boosting',
        },
      ],
      buttons: baseBtn,
    });
  }

  if (oMem.pending && !mem.pending) {
    await dispatchAuditlog(client, mem.guildId, AuditEvents.guildMemberUpdate, {
      targetTag: tgTag,
      fields: baseField,
      changes: [
        {
          type: 'note',
          text: 'Passed membership screening',
        },
      ],
      buttons: baseBtn,
    });
  }
}
