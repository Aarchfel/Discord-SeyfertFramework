import { createEvent } from 'seyfert';
import { handleAuditLogChannelUpdate } from 'src/events/helper/handle/channel/auditlog.channelUpdate';

export default createEvent({
  data: { name: 'channelUpdate' },

  async run([nChannel, oChannel], client) {
    await handleAuditLogChannelUpdate(nChannel, oChannel, client);
  },
});
