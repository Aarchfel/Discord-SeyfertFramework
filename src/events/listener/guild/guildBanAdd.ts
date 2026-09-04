import { createEvent } from 'seyfert';
import { handleAuditLogGuildBanAdd } from 'src/events/helper/handle/guild/auditlog.guildBanAdd';

export default createEvent({
  data: { name: 'guildBanAdd' },

  async run(ban, client) {
    await handleAuditLogGuildBanAdd(ban, client);
  },
});
