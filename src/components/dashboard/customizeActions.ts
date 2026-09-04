import { ComponentCommand, type ComponentContext, MessageFlags } from "seyfert";
import { setupDashboard } from "src/utils/dashboard/setup";
import { ImgKind, resetGuildImg } from "src/utils/imgUpload";
import { collGuildImg } from "src/utils/imgUpload";
import { assertAuthor } from "src/utils/onlyAuthor";

export default class CustomizeActions extends ComponentCommand {
  componentType = "Button" as const;

  filter(ctx: ComponentContext) {
    return (
      ctx.customId.startsWith("customize_set_") ||
      ctx.customId.startsWith("customize_reset_")
    );
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    if (!ctx.guildId) return;
    if (!(await assertAuthor(ctx))) return;

    const guild = await ctx.guild();
    if (!guild) return;

    const isReset = ctx.customId.includes("_reset_");

    const kind: ImgKind = ctx.customId.includes("welcome") ? "welcome" : "leave";

    if (isReset) {
      await ctx.deferReply();
      const res = await resetGuildImg(guild.id, kind);

      await ctx.editOrReply({
        content: res.success
          ? `Successfully reset the ${kind === "welcome" ? "welcome" : "leave"} image.`
          : `Failed to reset the ${kind === "welcome" ? "welcome" : "leave"} image. Reason: ${res.reason}`,
        flags: MessageFlags.Ephemeral,
      });

      await this.refreshDashboard(ctx, guild);
      return;
    }

    await ctx.write({
      content: `Send a \`png\`/\`jpg\`/\`jpeg\`/\`webp\`/\`gif\` image to set the ${kind === "welcome" ? "welcome" : "leave"} image.`,
      flags: MessageFlags.Ephemeral,
    });

    const res = await collGuildImg(ctx, kind);
    
    await ctx
      .editOrReply({
        content: res.success
          ? `Successfully set the ${kind === "welcome" ? "welcome" : "leave"} image.`
          : `Failed to set the ${kind === "welcome" ? "welcome" : "leave"} image. Reason: ${res.reason}`,
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => null);

    if (res.success) await this.refreshDashboard(ctx, guild);
  }

    // TODO: IF MODAL NEEDS REFRESH, CHANGE THIS INTO FUNCTION IN DIFFERENT FILE
  private async refreshDashboard(ctx: ComponentContext, guild: any) {
    const original = ctx.interaction.message;
    if (!original) return;

    const ch = await ctx.client.channels
      .fetch(original.channelId)
      .catch(() => null);
      
    if (ch && ch.isTextable()) {
      await ch.messages
        .edit(original.id, setupDashboard(guild))
        .catch(() => null); 
    }
  }
}
