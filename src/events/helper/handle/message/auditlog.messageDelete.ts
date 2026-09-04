import { Formatter, type Message, type Client, ButtonStyle } from 'seyfert';
import { AuditEvents } from 'src/utils/auditlog/auditEvents';
import { findMessageDeleter } from 'src/utils/auditlog/discordAuditlog';
import { dispatchAuditlog } from 'src/utils/auditlog/dispatch';
import type { AuditButtonDef, AuditField } from 'src/utils/card/auditlogCard';
import { truncate } from 'src/utils/formatter/label';

type messages =
  | Message
  | {
      id: string;
      channelId: string;
      guildId?: string | undefined;
    };

export async function handleAuditLogMessageDelete(
  msg: messages,
  client: Client<true>,
) {
  if (!msg.guildId) return;
  const rawContent = 'content' in msg && msg.content ? msg.content : null;
  const authorObj = 'author' in msg && msg.author ? msg.author : null;

  const content = rawContent
    ? truncate(rawContent, 1500)
    : '*(Content cant be cached / message sent before last bot reboot)*';
  const author = authorObj
    ? `${Formatter.userMention(authorObj.id)} - ${authorObj.username} (${authorObj.id})`
    : '*(Unknown User)*';

  let deletedBy = author;

  if (authorObj) {
    const delId = await findMessageDeleter(
      client,
      msg.guildId,
      authorObj.id,
      msg.channelId,
    );
    if (delId && delId !== authorObj.id) {
      deletedBy = `${Formatter.userMention(delId)} (${delId}) [Staff]`;
    }
  }

  const fields: AuditField[] = [
    {
      label: 'Author',
      value: author,
    },
    {
      label: 'Message ID',
      value: `\`${msg.id}\``,
    },
    {
      label: 'Channel',
      value: `${Formatter.channelMention(msg.channelId)} - \`${msg.channelId}\``,
    },
    {
      label: 'Content',
      value: `\n${content}`,
    },
  ];

  const buttons: AuditButtonDef[] = [
    {
      label: 'Jump to Channel',
      style: ButtonStyle.Link,
      url: `https://discord.com/channels/${msg.guildId}/${msg.channelId}`,
    },
    {
      label: 'Copy MessageID',
      style: ButtonStyle.Secondary,
      customId: `copyid_${msg.id}`,
    },
  ];

  if (authorObj) {
    buttons.push({
      label: 'View User',
      style: ButtonStyle.Link,
      url: `https://discord.com/users/${authorObj.id}`,
    });
  }

  await dispatchAuditlog(client, msg.guildId, AuditEvents.messageDelete, {
    actorTag: deletedBy,
    fields,
    buttons,
  });
}
