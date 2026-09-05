import { createEvent } from 'seyfert';
import { handleAuditLogMemberUpdate } from 'src/events/helper/handle/member/auditlog.memberUpdate';

export default createEvent({
  data: { name: 'guildMemberUpdate' },

  async run([mem, oMem], client) {
    await handleAuditLogMemberUpdate(mem, oMem, client);
  },
});
