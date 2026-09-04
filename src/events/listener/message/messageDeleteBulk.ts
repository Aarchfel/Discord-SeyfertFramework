import { createEvent } from 'seyfert';
import { handleAuditLogMessageDeleteBulk } from 'src/events/helper/handle/message/auditlog.messageDeleteBulk';

export default createEvent({
  data: { name: 'messageDeleteBulk' },

  async run(message, client) {
    await handleAuditLogMessageDeleteBulk(message, client);
  },
});
