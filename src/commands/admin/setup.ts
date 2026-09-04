import {
  Command,
  type CommandContext,
  Declare,
  MessageFlags,
} from "seyfert";
import { setupDashboard } from "src/utils/dashboard/setup";
import { registerAuthor } from "src/utils/onlyAuthor";

@Declare({
  name: "setup",
  description: "Setup dashboard for this server",
  integrationTypes: ["GuildInstall"],
  defaultMemberPermissions: ["Administrator"],
})
export default class SetupCommand extends Command {
  async run(ctx: CommandContext) {
    if (!ctx.guildId) return;

    const guild = await ctx.guild();
    if (!guild || !ctx.member) {
      return ctx.write({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // const setup = setupPanel(guild.id, guild.name);

    const set = setupDashboard(guild);
    const msg = await ctx.write({...set}, true);
    if (msg) registerAuthor(msg.id, ctx.author.id);
  }
}
