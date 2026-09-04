import { createEvent } from 'seyfert';
import { handleAuditLogRoleCreate } from 'src/events/helper/handle/role/auditlog.roleCreate';

export default createEvent({
  data: { name: 'guildRoleCreate' },

  async run(role, client) {
    await handleAuditLogRoleCreate(role, client);
  },
});
