import {
  type APIAuditLogEntry,
  AuditLogEvent,
  Formatter,
  type Client,
  type GuildRole,
  ButtonStyle,
} from 'seyfert';
import { AuditEvents } from 'src/utils/auditlog/auditEvents';
import { dispatchAuditlog } from 'src/utils/auditlog/dispatch';
import { isFresh } from 'src/utils/auditlog/importantFunc';
import { AuditButtonDef, AuditField } from 'src/utils/card/auditlogCard';
import { delayDefaultTime, sleep } from 'src/utils/delay';
import { discordTimestamp, snowflakeToDate } from 'src/utils/formatter/label';

type RoleType = GuildRole | { guildId: string; roleId: string };

export async function handleAuditLogRoleDelete(
  role: RoleType,
  client: Client<true>,
) {
  if (!('permissions' in role)) return;

  const guildId = role.guildId;
  const createdAt = snowflakeToDate(role.id);

  let execTag = '*Unknown User*';
  let execId: string | null = null;

  await sleep(delayDefaultTime);

  try {
    const auditlog = await client.proxy.guilds(guildId)['audit-logs'].get({
      query: {
        limit: 10,
        action_type: AuditLogEvent.RoleDelete,
      },
    });

    const entrs = auditlog?.audit_log_entries ?? ([] as APIAuditLogEntry[]);
    const roleEnt = entrs.find((e) => e.target_id === role.id && isFresh(e.id));

    if (roleEnt?.user_id) {
      execId = roleEnt.user_id;
      execTag = `${Formatter.userMention(roleEnt.user_id)} (\`${roleEnt.user_id}\`)`;
    }
  } catch (e) {
    console.error('Failed to fetch audit log', e);
  }

  const permK = role.permissions.keys();
  const perms =
    permK.length > 0 ? permK.map((p) => `\`${p}\``).join(', ') : '*None*';

  const fields: AuditField[] = [
    {
      label: 'Role',
      value: `__\`${role.name}\`__`,
    },
    {
      label: 'Role ID',
      value: `\`${role.id}\``,
    },
    {
      label: 'Created At',
      value: `${discordTimestamp(createdAt, 'F')} (${discordTimestamp(createdAt, 'R')})`,
    },
    {
      label: 'Permissions',
      value: perms,
    },
  ];

  const buttons: AuditButtonDef[] = [
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

  await dispatchAuditlog(client, guildId, AuditEvents.roleDelete, {
    targetTag: `\`${role.name}\``,
    actorTag: execTag,
    fields,
    buttons,
  });
}
