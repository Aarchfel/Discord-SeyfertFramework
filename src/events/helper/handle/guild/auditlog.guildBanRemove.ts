import {
  AuditLogEvent,
  ButtonStyle,
  Formatter,
  User,
  type Client,
} from 'seyfert';
import { AuditEvents } from 'src/utils/auditlog/auditEvents';
import { dispatchAuditlog } from 'src/utils/auditlog/dispatch';
import { isFresh } from 'src/utils/auditlog/importantFunc';
import { AuditField } from 'src/utils/card/auditlogCard';
import { discordTimestamp, snowflakeToDate } from 'src/utils/formatter/label';

interface Unban {
  user: User;
  guildId: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const defTime = 1000;

export async function handleAuditLogGuildBanRemove(
  unban: Unban,
  client: Client<true>,
) {
  const user = unban.user ?? unban;
  const guildId = unban.guildId;
  const createdAt = snowflakeToDate(user.id);

  let execTag = '*Unknown User*';
  let reason = 'No reason provided';

  await sleep(defTime);

  try {
    const auditlog = await client.proxy.guilds(guildId)['audit-logs'].get({
      query: {
        limit: 10,
        action_type: AuditLogEvent.MemberBanRemove,
      },
    });

    const entrs = auditlog?.audit_log_entries ?? [];
    const unbanEnt = entrs.find(
      (e: any) => e.target_id === user.id && isFresh(e.id),
    );

    if (unbanEnt) {
      if (unbanEnt.user_id) {
        execTag = `${Formatter.userMention(unbanEnt.user_id)} (\`${unbanEnt.user_id}\`)`;
      }
      if (unbanEnt.reason) {
        reason = unbanEnt.reason;
      }
    }
  } catch (e) {
    console.error('Error fetching AuditLog', e);
  }

  const fields: AuditField[] = [
    {
      label: 'Target user',
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
    {
      label: 'Account Created At',
      value: `${discordTimestamp(createdAt, 'F')} (${discordTimestamp(createdAt, 'R')})`,
    },
  ];

  await dispatchAuditlog(client, guildId, AuditEvents.guildBanRemove, {
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
        label: 'Re-Ban User',
        style: ButtonStyle.Danger,
        customId: `userban_${user.id}`,
      },
    ],
  });
}
