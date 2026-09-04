import { createEvent } from 'seyfert';
import { handleAuditLogChannelDelete } from 'src/events/helper/handle/channel/auditlog.channelDelete';

export default createEvent({
  data: { name: 'channelDelete' },

  async run(channel, client) {
    await handleAuditLogChannelDelete(channel, client);
  },
});
