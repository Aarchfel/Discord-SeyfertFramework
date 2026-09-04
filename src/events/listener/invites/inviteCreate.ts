import { createEvent } from "seyfert";
import { cacheGuildInvites } from "src/utils/invites/inviteTracker";

export default createEvent({
  data: {name: 'inviteCreate'},
  async run(invite, client) {
    const guild = await client.guilds.fetch(invite.guildId).catch(() => null);
    if (guild) await cacheGuildInvites(client, guild.id);
  }
})
