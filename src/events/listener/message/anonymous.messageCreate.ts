import { createEvent, MessageFlags } from 'seyfert';
import {
  getCreateAnonWebhook,
  invalidateAnonWebhook,
} from 'src/utils/anonWebhook';
import { isAnonCh } from 'src/utils/cache/anonWebhook';
import { anonlogCard } from 'src/utils/card/anonCard';
import { insertAnonLog, setAnonLogMsgId } from 'src/utils/database/anonymousDB';
import { getGuildConfig } from 'src/utils/database/guildConfig';
import { resolveAnonAttach, toAttachBuilder } from 'src/utils/files/anonAttach';

export default createEvent({
  data: { name: 'messageCreate' },
  async run(msg, client) {
    if (msg.author.bot || msg.webhookId) return;
    if (!msg.guildId) return;

    const gId = isAnonCh(msg.channelId);
    if (!gId) return;

    let rawContent = msg.content ?? '';
    const resolvedAttach = await resolveAnonAttach(msg.attachments ?? []);

    const repMsgId =
      msg.messageReference?.messageId ?? msg.referencedMessage?.id;
    let repHeader = '';

    if (repMsgId) {
      const jumpurl = `https://discord.com/channels/${msg.guildId}/${msg.channelId}/${repMsgId}`;
      repHeader = `> -# *Replying to [Anonymous Message](${jumpurl})*\n`;
    }

    const content = `${repHeader}${rawContent}`.trim();

    const [, webhook] = await Promise.all([
      msg.delete().catch(() => null),
      getCreateAnonWebhook(client, msg.channelId, gId).catch((err) => {
        client.logger.error('Failed to get/create anon webhook:', err);
        return null;
      }),
    ]);

    if (!content && resolvedAttach.length === 0) return;
    if (!webhook) return;

    let guild = client.cache.guilds?.get(gId);
    if (!guild) {
      guild = await client.guilds.fetch(gId).catch(() => undefined);
    }

    let webhookMsgId: string | undefined;
    try {
      const sent = await client.webhooks.writeMessage(
        webhook.id,
        webhook.token,
        {
          body: {
            content: content || undefined,
            username: 'Anonymous Chat',
            avatar_url: guild?.iconURL({ size: 256 }) ?? undefined,
            allowed_mentions: { parse: ['users'] },
            files: toAttachBuilder(resolvedAttach),
          },
          query: { wait: true },
        },
      );

      webhookMsgId = sent?.id;
    } catch (err: any) {
      if (err?.metadata?.status === 404) invalidateAnonWebhook(msg.channelId);
      client.logger.error('Failed to proxy anon message:', err);
    }

    const logId = insertAnonLog({
      guildId: gId,
      channelId: msg.channelId,
      userId: msg.author.id,
      content: content || '[attachment/no content]',
      webhookMessageId: webhookMsgId,
    });

    const gcfg = getGuildConfig(gId);
    if (!gcfg.anonymouslog_channel) return;

    const logCh = await client.channels
      .fetch(gcfg.anonymouslog_channel)
      .catch(() => null);
    if (!logCh || !logCh.isTextable()) return;

    const logCard = anonlogCard({
      logId,
      guildId: gId,
      channelId: msg.channelId,
      userId: msg.author.id,
      userAvatarUrl: msg.author.avatarURL({ size: 128 }),
      content: content || '*[attachment/no content]*',
      webhookMessageId: webhookMsgId,
      attachments: resolvedAttach,
    });

    const logMsg = await logCh.messages
      .write({
        components: [logCard],
        flags: MessageFlags.IsComponentsV2,
        files: toAttachBuilder(resolvedAttach),
      })
      .catch(() => null);

    if (logMsg) setAnonLogMsgId(logId, logMsg.id);
  },
});
