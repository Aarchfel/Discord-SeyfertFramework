import { createEvent } from 'seyfert';
import { handleAuditLogMemberAdd } from 'src/events/helper/handle/guild/auditlog.memberAdd';
import {
  buildGCIContext,
  sendGreetDM,
  sendWelcomeCard,
} from 'src/events/helper/handle/guild/welcome.memberAdd';
import { getGuildConfig } from 'src/utils/database/guildConfig';

export default createEvent({
  data: { name: 'guildMemberAdd' },
  async run(member, client) {
    const guild = await client.guilds.fetch(member.guildId).catch(() => null);
    if (!guild) return;

    const gcfg = getGuildConfig(guild.id);
    if (!gcfg.welcome_channel) return;

    const roleid = gcfg.default_role;
    if (!roleid) return;

    await member.roles
      .add(roleid)
      .then(() => console.log(`[Member] Added role ${roleid} to ${member.id}`))
      .catch((err) =>
        console.error(
          `[Member] Failed to add role ${roleid} to ${member.id}`,
          err.message,
        ),
      );

    const ctx = await buildGCIContext(client, guild);

    await sendWelcomeCard(member, client, guild, ctx);
    await sendGreetDM(client, member, guild, ctx);

    await handleAuditLogMemberAdd(member, client, guild, ctx);
  },
});
