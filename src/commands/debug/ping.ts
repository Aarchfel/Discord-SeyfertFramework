import { Command, type CommandContext, Declare } from 'seyfert';
import { Cooldown } from '@slipher/cooldown';

@Declare({
  name: 'ping',
  description: "Check this bot's latency",
  aliases: ['ping'],
  integrationTypes: ['GuildInstall', 'UserInstall'],
})
@Cooldown.user(10_000)
export default class PingCommand extends Command {
  async run(ctx: CommandContext) {
    const client = ctx.client as import('seyfert').UsingClient;
    const ping = client.gateway.latency;

    await ctx.write({
      content: `Pong! Latency: \`\`${ping}\`\`ms`
    });
  }
}

