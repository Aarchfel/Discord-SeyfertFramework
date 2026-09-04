const { config } = require('seyfert');
const dotenv = require('dotenv');
dotenv.config();

module.exports = config.bot({
  token: process.env.BOT_TOKEN,
  intents: [
    'Guilds',
    'GuildMessages',
    'MessageContent',
    'GuildMembers',
    'GuildMessageReactions',
    'GuildVoiceStates',
    'DirectMessages',
    'GuildModeration',
  ],
  locations: {
    base: 'src',
    commands: 'commands',
    events: 'events',
    components: 'components',
    guards: 'guards',
  },
  cache: {
    disabledCache: {
      message: false,
      channels: false,
    },
    properties: {
      message: {
        maxSize: 100,
      },
      channel: {
        maxSize: 100,
      },
    },
  },
});
