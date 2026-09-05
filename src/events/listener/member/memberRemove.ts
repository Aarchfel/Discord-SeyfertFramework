import { createEvent } from 'seyfert';
import { handleAuditLogMemberDelete } from 'src/events/helper/handle/member/auditlog.memberDelete';
import { sendLeaveCard } from 'src/events/helper/handle/member/leave.memberDelete';
import { buildGCIContext } from 'src/events/helper/handle/member/welcome.memberAdd';
import { getGuildConfig } from 'src/utils/database/guildConfig';

export default createEvent({
  data: { name: 'guildMemberRemove' },
  async run(member, client) {
    const guild = await client.guilds.fetch(member.guildId).catch(() => null);
    if (!guild) return;

    const gcfg = getGuildConfig(guild.id);
    if (!gcfg.leave_channel) return;

    const ctx = await buildGCIContext(client, guild);

    await sendLeaveCard(member, client, guild, ctx);
    await handleAuditLogMemberDelete(member, client, guild);
  },
});
