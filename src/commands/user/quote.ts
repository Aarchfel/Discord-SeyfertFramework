import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, Declare } from "seyfert";
import { getAdviceQ } from "src/utils/quote.js";

@Declare({
  name: 'quotes',
  description: 'Get your advice quotes!',
  integrationTypes: ['GuildInstall', 'UserInstall'],
})
@Cooldown.user(10_000)
export default class QuoteCommand extends Command {
  async run(ctx: CommandContext) {
    await ctx.deferReply();
    const advice = await getAdviceQ() ?? 'Sometimes code does not work, but life must be continue.';

    await ctx.editOrReply({content: `“${advice}”`});
  }
}