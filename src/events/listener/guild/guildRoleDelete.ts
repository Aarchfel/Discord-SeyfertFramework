import { createEvent } from 'seyfert';
import { handleAuditLogRoleDelete } from 'src/events/helper/handle/role/auditlog.roleDelete';

export default createEvent({
  data: { name: 'guildRoleDelete' },

  async run(role, client) {
    await handleAuditLogRoleDelete(role, client);
  },
});
