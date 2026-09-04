import { createEvent } from 'seyfert';
import { handleAuditLogGuildUpdate } from 'src/events/helper/handle/guild/auditlog.guildUpdate';

export default createEvent({
  data: { name: 'guildUpdate' },

  async run([nGuild, oGuild], client) {
    // Maybe bug?
    if (!oGuild) return;

    // Bro so tiny only need 1 popcorn
    await handleAuditLogGuildUpdate(nGuild, oGuild, client);
  },
});
