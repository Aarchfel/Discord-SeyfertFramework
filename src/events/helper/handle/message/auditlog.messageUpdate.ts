import { Formatter, type Client, type Message } from 'seyfert';
import { AuditEvents } from 'src/utils/auditlog/auditEvents';
import { dispatchAuditlog } from 'src/utils/auditlog/dispatch';
import type {
  AuditButtonDef,
  AuditChange,
  AuditField,
} from 'src/utils/card/auditlogCard';
import { truncate } from 'src/utils/formatter/label';

type oldMessage = Message | (Omit<Message, 'tts'> & { tts: boolean });

export async function handleAuditLogMessageUpdate(
  msgN: oldMessage,
  msgO: Message | undefined,
  client: Client<true>,
) {
  if (!msgN.guildId) return;

  const before = msgO?.content;
  const after = msgN.content;

  const bef = before
    ? truncate(before, 700)
    : '*(Content cant be cached / message sent before last bot reboot)*';
  const aft = after ? truncate(after, 700) : '*(Empty)*';
  const author = msgN.author
    ? `${Formatter.userMention(msgN.author.id)} - ${msgN.author.username} (\`${msgN.author.id}\`)`
    : '*(Unknown User)*';

  const fields: AuditField[] = [
    {
      label: 'Channel',
      value: `${Formatter.channelMention(msgN.channelId)} - \`${msgN.channelId}\``,
    },
    {
      label: 'Message ID',
      value: `\`${msgN.id}\``,
    },
  ];

  const changes: AuditChange[] = [
    {
      type: 'contentEdit',
      text: 'Content',
      before: bef,
      after: aft,
    },
  ];

  const buttons: AuditButtonDef[] = [];

  await dispatchAuditlog(client, msgN.guildId, AuditEvents.messageUpdate, {
    actorTag: author,
    fields,
    changes,
    buttons,
  });
}
