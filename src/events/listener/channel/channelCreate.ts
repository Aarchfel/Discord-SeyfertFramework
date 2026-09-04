import { createEvent } from 'seyfert';
import { handleAuditLogChannelCreate } from 'src/events/helper/handle/channel/auditlog.channelCreate';

export default createEvent({
  data: { name: 'channelCreate' },

  async run(channel, client) {
    await handleAuditLogChannelCreate(channel, client);
  },
});
