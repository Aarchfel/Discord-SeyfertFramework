import {
  AuditLogEvent,
  ButtonStyle,
  Client,
  Formatter,
  GuildRole,
} from 'seyfert';
import { AuditEvents } from 'src/utils/auditlog/auditEvents';
import { dispatchAuditlog } from 'src/utils/auditlog/dispatch';
import { isFresh } from 'src/utils/auditlog/importantFunc';
import {
  AuditButtonDef,
  AuditChange,
  AuditField,
} from 'src/utils/card/auditlogCard';
import { delayDefaultTime, sleep } from 'src/utils/delay';
import {
  buildRolePermsChange,
  discordTimestamp,
  snowflakeToDate,
} from 'src/utils/formatter/label';

export async function handleAuditLogRoleCreate(
  role: GuildRole,
  client: Client<true>,
) {
  const guildId = role.guildId;
  const createdAt = snowflakeToDate(role.id);

  let execTag = '*Unknown User*';
  let execId: string | null = null;
  let roleEnt: any | null;

  await sleep(delayDefaultTime);

  try {
    const auditlog = await client.proxy.guilds(guildId)['audit-logs'].get({
      query: {
        limit: 10,
        action_type: AuditLogEvent.RoleCreate,
      },
    });

    const entrs = auditlog?.audit_log_entries ?? [];
    const roleEnt = entrs.find(
      (e: any) => e.target_id === role.id && isFresh(e.id),
    );

    if (roleEnt?.user_id) {
      execId = roleEnt.user_id;
      execTag = `${Formatter.userMention(roleEnt.user_id)} (\`${roleEnt.user_id}\`)`;
    }
  } catch (e) {
    console.error('Failed to fetch auditlog', e);
  }

  const fields: AuditField[] = [
    {
      label: 'Role Name',
      value: `\`${role.name}\``,
    },
    {
      label: 'Role ID',
      value: `\`${role.id}\``,
    },
    {
      label: 'Created At',
      value: `${discordTimestamp(createdAt, 'F')} (${discordTimestamp(createdAt, 'R')})`,
    },
  ];

  const changes: AuditChange[] = [];
  if (roleEnt) {
    const permChange = buildRolePermsChange(roleEnt);
    if (permChange) {
      changes.push(permChange);
    }
  }

  const buttons: AuditButtonDef[] = [
    {
      label: 'Delete Role (⚠️)',
      style: ButtonStyle.Danger,
      customId: `roledelete_${role.id}`,
    },
    {
      label: 'Copy RoleID',
      style: ButtonStyle.Secondary,
      customId: `copyid_${role.id}`,
    },
  ];

  if (execId) {
    buttons.push({
      label: 'View Executor',
      style: ButtonStyle.Link,
      url: `https://discord.com/users/${execId}`,
    });
  }

  await dispatchAuditlog(client, guildId, AuditEvents.roleCreate, {
    targetTag: `${Formatter.roleMention(role.id)}`,
    actorTag: execTag,
    fields,
    changes: changes.length ? changes : undefined,
    buttons,
  });
}
