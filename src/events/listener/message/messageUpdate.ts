import { createEvent } from 'seyfert';
import { handleAuditLogMessageUpdate } from 'src/events/helper/handle/message/auditlog.messageUpdate';

export default createEvent({
  data: { name: 'messageUpdate' },

  async run([msgN, msgO], client) {
    msgN;
    if (!msgN.guildId) return;
    if (msgO?.content === msgN.content) return;
    if (msgN.author?.bot || msgN.webhookId) return;

    await handleAuditLogMessageUpdate(msgN, msgO, client);
  },
});
