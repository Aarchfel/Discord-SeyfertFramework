import { createEvent } from 'seyfert';
import { handleAuditLogRoleUpdate } from 'src/events/helper/handle/role/auditlog.roleUpdate';

export default createEvent({
  data: { name: 'guildRoleUpdate' },

  async run([nRole, oRole], client) {
    await handleAuditLogRoleUpdate(nRole, oRole, client);
  },
});
