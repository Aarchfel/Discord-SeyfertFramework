import {
  AuditLogEvent,
  ButtonStyle,
  Formatter,
  User,
  UsingClient,
} from 'seyfert';
import { AuditEvents } from 'src/utils/auditlog/auditEvents';
import { dispatchAuditlog } from 'src/utils/auditlog/dispatch';
import { isFresh } from 'src/utils/auditlog/importantFunc';
import { AuditField } from 'src/utils/card/auditlogCard';
import { discordTimestamp, snowflakeToDate } from 'src/utils/formatter/label';

interface Ban {
  guildId: string;
  user: User;
  reason?: string | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function handleAuditLogGuildBanAdd(ban: Ban, client: UsingClient) {
  const user = ban.user ?? ban;
  const createdAt = snowflakeToDate(user.id);

  let execTag = '*Unknown User*';
  let reason = ban.reason ?? 'No reason provided';
  let delDays: number | null = null;

  await sleep(1000);

  try {
    const auditlog = await client.proxy.guilds(ban.guildId)['audit-logs'].get({
      query: {
        limit: '10',
        action_type: AuditLogEvent.MemberBanAdd,
      },
    });

    const entrs = auditlog?.audit_log_entries ?? [];
    const banEnt = entrs.find(
      (e: any) => e.target_id === user.id && isFresh(e.id),
    );

    if (banEnt) {
      if (banEnt.user_id) {
        execTag = `${Formatter.userMention(banEnt.user_id)} (\`${banEnt.user_id}\`)`;
      }
      if (reason === 'No reason provided' && banEnt.reason) {
        reason = banEnt.reason;
      }
      if (banEnt.options?.delete_member_days) {
        delDays = Number(banEnt.options.delete_member_days);
      }
    }
  } catch (err) {
    console.error('Error fetching audit log:', err);
  }

  const fields: AuditField[] = [
    {
      label: 'Target User',
      value: `${Formatter.userMention(user.id)} - ${user.username} (\`${user.id}\`)`,
    },
    {
      label: 'Reason',
      value: reason,
    },
    {
      label: 'Account Type',
      value: user.bot ? '`*_< Bot Account`' : '`</> User Account`',
    },
  ];

  if (delDays !== null) {
    fields.push({
      label: 'Pruned Messages',
      value: `Deleted last __${delDays} days__ of messages`,
    });
  }

  fields.push({
    label: 'Account Created At',
    value: `${discordTimestamp(createdAt, 'F')} (${discordTimestamp(createdAt, 'R')})`,
  });

  await dispatchAuditlog(client, ban.guildId, AuditEvents.guildBanAdd, {
    actorTag: execTag,
    targetTag: `${Formatter.userMention(user.id)} - ${user.username} (\`${user.id}\`)`,
    fields,
    buttons: [
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
      {
        label: 'Unban User',
        style: ButtonStyle.Danger,
        customId: `userunban_${user.id}`,
      },
    ],
  });
}
