import { ActivityType, createEvent, PresenceUpdateStatus } from 'seyfert';
import { cacheGuildInvites } from 'src/utils/invites/inviteTracker';

export default createEvent({
  data: { once: true, name: 'botReady' },
  async run(user, client) {
    client.logger.info(`Logged in as ${user.username}`);

    await client.hoshimi.init({ id: user.id, username: user.username });
    client.logger.info(`Hoshimi initialized!`);

    // const test = await client.guilds.fetch("1503086465662455899");
    // console.log("guild fetched via REST:", test.name);

    // const raw = await test.invites.list();
    // console.log("raw invites:", JSON.stringify(raw, null, 2));

    for (const guild of client.cache.guilds?.values() ?? []) {
      await cacheGuildInvites(client, guild.id);
    }

    client.gateway.setPresence({
      activities: [
        {
          name: 'Rizzing up the server',
          state: 'Type shit in chat to get rizzed up',
          type: ActivityType.Custom,
        },
      ],
      status: PresenceUpdateStatus.DoNotDisturb,
      since: null,
      afk: false,
    });
  },
});
