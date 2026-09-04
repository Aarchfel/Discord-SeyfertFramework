import { createEvent } from 'seyfert';
import { handleAuditLogGuildBanRemove } from 'src/events/helper/handle/guild/auditlog.guildBanRemove';

export default createEvent({
  data: { name: 'guildBanRemove' },

  async run(unban, client) {
    await handleAuditLogGuildBanRemove(unban, client);
  },
});
