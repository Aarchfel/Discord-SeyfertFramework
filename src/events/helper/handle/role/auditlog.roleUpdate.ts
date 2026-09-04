import { LRUCache } from 'lru-cache/raw';
import {
  AuditLogEvent,
  ButtonStyle,
  Client,
  Formatter,
  GuildRole,
} from 'seyfert';
import type { APIAuditLogEntry } from 'seyfert';
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

type PosEntry = {
  roleId: string;
  roleName: string;
  before: number;
  after: number;
};

const reOrderDeb = 1500;
const reOrderBuffer = new Map<
  string,
  { entries: Map<string, PosEntry>; timer: NodeJS.Timeout }
>();

function queuePositionChange(
  client: Client<true>,
  guildId: string,
  entry: PosEntry,
) {
  let buf = reOrderBuffer.get(guildId);

  if (!buf) {
    buf = { entries: new Map(), timer: undefined as unknown as NodeJS.Timeout };
    reOrderBuffer.set(guildId, buf);
  } else {
    clearTimeout(buf.timer);
  }

  buf?.entries.set(entry.roleId, entry);

  buf.timer = setTimeout(() => {
    void flushPositionChange(client, guildId);
  }, reOrderDeb);
}

async function flushPositionChange(client: Client<true>, guildId: string) {
  const buf = reOrderBuffer.get(guildId);
  if (!buf) return;

  reOrderBuffer.delete(guildId);
  const entrs = [...buf.entries.values()];
  if (!entrs.length) return;

  entrs.sort((a, b) => a.after - b.after);

  const fields: AuditField[] = entrs.map((e) => ({
    label: Formatter.roleMention(e.roleId),
    value: `\`${e.before}\` -> \`${e.after}\``,
  }));

  await dispatchAuditlog(client, guildId, AuditEvents.roleUpdate, {
    targetTag:
      entrs.length === 1
        ? `\`${entrs[0].roleName}\``
        : `__${entrs.length} roles position reordered__`,
    actorTag: "*Role ReOrder (System / User, discord can't detect)*",
    fields: [
      { label: 'Roles Affected', value: `__${entrs.length}__` },
      ...fields,
    ],
  });
}

const processedAuditEntrs = new LRUCache<string, true>({
  max: 500,
  ttl: 10_000,
});

function isAuditProcessed(entId: string): boolean {
  return processedAuditEntrs.has(entId);
}

function markAuditEnt(entId: string) {
  processedAuditEntrs.set(entId, true);
}

export async function handleAuditLogRoleUpdate(
  nRole: GuildRole,
  oRole: GuildRole | undefined,
  client: Client<true>,
) {
  const guildId = nRole.guildId;
  const createdAt = snowflakeToDate(nRole.id);

  let execTag = '*Unknown User*';
  let execId: string | null = null;
  let roleEnt: APIAuditLogEntry | undefined;
  const changes: AuditChange[] = [];

  await sleep(delayDefaultTime);

  try {
    const auditlog = await client.proxy.guilds(guildId)['audit-logs'].get({
      query: {
        limit: 10,
        action_type: AuditLogEvent.RoleUpdate,
      },
    });

    const entrs = auditlog?.audit_log_entries ?? ([] as APIAuditLogEntry[]);
    roleEnt = entrs.find((e) => e.target_id === nRole.id && isFresh(e.id));

    if (roleEnt && isAuditProcessed(roleEnt.id)) roleEnt = undefined;

    if (roleEnt?.user_id) {
      execId = roleEnt.user_id;
      execTag = `${Formatter.userMention(roleEnt.user_id)} (\`${roleEnt.user_id}\`)`;
    }
  } catch (e) {
    console.error('Failed to fetch audit log', e);
  }

  if (roleEnt?.changes) {
    for (const c of roleEnt.changes) {
      switch (c.key) {
        case 'name':
          changes.push({
            type: 'edit',
            text: 'Role Name',
            before: `\`${c.old_value}\``,
            after: `\`${c.new_value}\``,
          });
          break;

        case 'color':
          const oColor = c.old_value
            ? `#${Number(c.old_value).toString(16).padStart(6, '0')}`
            : 'Default';
          const nColor = c.new_value
            ? `#${Number(c.new_value).toString(16).padStart(6, '0')}`
            : 'Default';
          changes.push({
            type: 'edit',
            text: 'Role Color',
            before: `\`${oColor}\``,
            after: `\`${nColor}\``,
          });
          break;

        case 'hoist':
          changes.push({
            type: 'edit',
            text: 'Display Separately (Hoist)',
            before: c.old_value ? '`Yes`' : '`No`',
            after: c.new_value ? '`Yes`' : '`No`',
          });
          break;

        case 'mentionable':
          changes.push({
            type: 'edit',
            text: 'Mentionable',
            before: c.old_value ? '`Yes`' : '`No`',
            after: c.new_value ? '`Yes`' : '`No`',
          });
          break;

        case 'permissions':
          const permChange = buildRolePermsChange(roleEnt);
          if (permChange) changes.push(permChange);
          break;

        case 'position':
          changes.push({
            type: 'edit',
            text: 'Role Position',
            before: `\`${c.old_value}\``,
            after: `\`${c.new_value}\``,
          });
          break;
      }
    }
  }

  if (!changes.length && oRole) {
    if (oRole.name !== nRole.name) {
      changes.push({
        type: 'edit',
        text: 'Role Name',
        before: `\`${oRole.name}\``,
        after: `\`${nRole.name}\``,
      });
    }
  }

  if (oRole && oRole.position !== nRole.position && !changes.length) {
    queuePositionChange(client, guildId, {
      roleId: nRole.id,
      roleName: nRole.name,
      before: oRole.position,
      after: nRole.position,
    });
    return;
  }

  if (!changes.length) return;

  const fields: AuditField[] = [
    {
      label: 'Role',
      value: `${Formatter.roleMention(nRole.id)}`,
    },
    {
      label: 'Role ID',
      value: `\`${nRole.id}\``,
    },
    {
      label: 'Created At',
      value: `${discordTimestamp(createdAt, 'F')} (${discordTimestamp(createdAt, 'R')})`,
    },
  ];

  const buttons: AuditButtonDef[] = [
    {
      label: 'Copy RoleID',
      style: ButtonStyle.Secondary,
      customId: `copyid_${nRole.id}`,
    },
  ];

  if (execId) {
    buttons.push({
      label: 'View Executor',
      style: ButtonStyle.Link,
      url: `https://discord.com/users/${execId}`,
    });
  }

  if (roleEnt) markAuditEnt(roleEnt.id);

  await dispatchAuditlog(client, guildId, AuditEvents.roleUpdate, {
    targetTag: `\`${nRole.name}\``,
    actorTag: execTag,
    fields,
    changes: changes.length ? changes : undefined,
    buttons,
  });
}
