import { ButtonStyle, Formatter } from 'seyfert';
import {
  AuditLogEvent,
  type Client,
  type GatewayMessageDeleteBulkDispatchData,
} from 'seyfert';
import { AuditEvents } from 'src/utils/auditlog/auditEvents';
import { dispatchAuditlog } from 'src/utils/auditlog/dispatch';
import { isFresh } from 'src/utils/auditlog/importantFunc';
import { AuditButtonDef, AuditField } from 'src/utils/card/auditlogCard';
import { delayDefaultTime, sleep } from 'src/utils/delay';

export async function handleAuditLogMessageDeleteBulk(
  msgs: GatewayMessageDeleteBulkDispatchData,
  client: Client<true>,
) {
  if (!msgs.ids.length || !msgs.guild_id) return;

  const cId = msgs.channel_id;
  const gId = msgs.guild_id;

  let execTag = '*Unknown User/Bot*';
  let execId: string | null = null;

  await sleep(delayDefaultTime);

  try {
    const auditlog = await client.proxy.guilds(gId)['audit-logs'].get({
      query: {
        limit: 10,
        action_type: AuditLogEvent.MessageBulkDelete,
      },
    });

    const entrs = auditlog?.audit_log_entries ?? [];
    const msgEnt = entrs.find((e) => {
      const tgIsCh = e.target_id === cId && isFresh(e.id);
      const optHasCh =
        (e.options as { channel_id?: string } | undefined)?.channel_id ===
          cId && isFresh(e.id);
      return tgIsCh || optHasCh;
    });

    if (msgEnt?.user_id) {
      execId = msgEnt.user_id;
      execTag = `${Formatter.userMention(msgEnt.user_id)} (\`${msgEnt.user_id}\`)`;
    }
  } catch (err) {
    client.logger.error(
      `Failed to fetch auditlog for message bulk delete: ${err}`,
    );
  }

  const fields: AuditField[] = [
    {
      label: 'Channel',
      value: Formatter.channelMention(cId),
    },
    {
      label: 'Amount Deleted',
      value: `\`${msgs.ids.length}\``,
    },
  ];

  if (execId) {
    fields.push({
      label: 'Executor',
      value: execTag,
    });
  }

  const buttons: AuditButtonDef[] = [
    {
      label: 'View Channel',
      style: ButtonStyle.Link,
      url: `https://discord.com/channels/${gId}/${cId}`,
    },
    {
      label: 'Copy ChannelID',
      style: ButtonStyle.Secondary,
      customId: `copyid_${cId}`,
    },
  ];

  if (execId) {
    buttons.push({
      label: 'View Executor',
      style: ButtonStyle.Link,
      url: `https://discord.com/users/${execId}`,
    });
  }

  await dispatchAuditlog(client, gId, AuditEvents.messageDeleteBulk, {
    targetTag: `${Formatter.channelMention(cId)} (\`${cId}\`)`,
    actorTag: execTag,
    fields,
    buttons,
  });
}
