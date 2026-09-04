import {
  AllChannels,
  AuditLogEvent,
  ButtonStyle,
  Client,
  Formatter,
} from 'seyfert';
import { AuditEvents } from 'src/utils/auditlog/auditEvents';
import { dispatchAuditlog } from 'src/utils/auditlog/dispatch';
import { isFresh } from 'src/utils/auditlog/importantFunc';
import { AuditButtonDef, AuditField } from 'src/utils/card/auditlogCard';
import { formatChannelType } from 'src/utils/formatter/label';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const defTime = 1000;

export async function handleAuditLogChannelDelete(
  channel: AllChannels,
  client: Client<true>,
) {
  if (!('guildId' in channel) || !channel.guildId) return;

  const guildId = channel.guildId;
  let execTag = '*Unknown User*';
  let execId: string | null = null;

  await sleep(defTime);

  try {
    const auditlog = await client.proxy.guilds(guildId)['audit-logs'].get({
      query: {
        limit: 10,
        action_type: AuditLogEvent.ChannelDelete,
      },
    });

    const entrs = auditlog?.audit_log_entries ?? [];
    const channelEnt = entrs.find(
      (e) => e.target_id === channel.id && isFresh(e.id),
    );

    if (channelEnt?.user_id) {
      execId = channelEnt.user_id;
      execTag = `${Formatter.userMention(channelEnt.user_id)} (\`${channelEnt.user_id}\`)`;
    }
  } catch (e) {
    console.error('Failed to fetch audit log:', e);
  }

  const chName = 'name' in channel ? channel.name : 'Unknown Channel';

  const fields: AuditField[] = [
    {
      label: 'Channel Name',
      value: `__${chName}__ (\`${channel.id}\`)`,
    },
    {
      label: 'Channel Type',
      value: formatChannelType(channel.type),
    },
  ];

  const buttons: AuditButtonDef[] = [
    {
      label: 'Copy ChannelID',
      style: ButtonStyle.Secondary,
      customId: `copyid_${channel.id}`,
    },
  ];

  if (execId) {
    buttons.push({
      label: 'View Executor',
      style: ButtonStyle.Link,
      url: `https://discord.com/users/${execId}`,
    });
  }

  if ('parentId' in channel && channel.parentId) {
    fields.push({
      label: 'Category',
      value: `${Formatter.channelMention(channel.parentId)} - \`${channel.parentId}\``,
    });
  }

  await dispatchAuditlog(client, guildId, AuditEvents.channelDelete, {
    targetTag: `__${chName}__`,
    actorTag: execTag,
    fields,
    buttons,
  });
}
