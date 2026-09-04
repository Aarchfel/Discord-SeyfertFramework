import { createEvent } from 'seyfert';
import { handleAuditLogMessageDelete } from 'src/events/helper/handle/message/auditlog.messageDelete';
import { isAnonCh } from 'src/utils/cache/anonWebhook';

export default createEvent({
  data: { name: 'messageDelete' },

  async run(msg, client) {
    if (!msg.guildId) return;
    if (msg.id === client.user?.id) return;
    if (isAnonCh(msg.channelId)) return;

    await handleAuditLogMessageDelete(msg, client);
  },
});
