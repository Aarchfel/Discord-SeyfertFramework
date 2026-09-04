import { Hoshimi, SearchSources } from 'hoshimi';
import { type Client } from 'seyfert';
import { registerHoshimiPlayer } from './events/music/trackStart';
import { config } from './config';

export function createMusicClient(client: Client) {
  const hoshimi = new Hoshimi({
    defaultSearchSource: SearchSources.Youtube,
    sendPayload: async (guildId, payload) => {
      const shardId = client.gateway.calculateShardId(guildId);
      await client.gateway.send(shardId, payload);
    },
    nodes: [
      {
        host: '127.0.0.1', // In this case im using localhost
        port: config.port, // Your lovely port
        password: config.hoshimiKey, // Or you can hardcoded it heh
        secure: false, // If you want to use https
      },
    ],
  });

  (client as any).hoshimi = hoshimi;
  registerHoshimiPlayer(client);

  return hoshimi;
}
