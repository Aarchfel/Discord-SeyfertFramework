import { Command, CommandContext, Declare } from "seyfert";
import { dashboardPayload, renderMainView } from "src/utils/dashboard/auditlog/ALMainView";
import { registerAuthor } from "src/utils/onlyAuthor";
import { Cooldown } from "@slipher/cooldown";

@Declare({
  name: "logsetup",
  description: "Configure the logging system using dashboard",
  integrationTypes: ["GuildInstall"],
  defaultMemberPermissions: ["ManageGuild"],
})
@Cooldown.user(10_000)
export default class LogsetupCommand extends Command {
  async run(ctx: CommandContext) {
    const container = renderMainView(ctx.guildId!);

    const msg = await ctx.write(dashboardPayload(container), true);

    registerAuthor(msg.id, ctx.author.id);
  }
}
