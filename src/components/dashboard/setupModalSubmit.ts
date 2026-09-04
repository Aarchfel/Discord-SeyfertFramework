import { ModalCommand, type ModalContext } from "seyfert";
import { updateAnonChCache } from "src/utils/cache/anonWebhook";
import { setupDashboard } from "src/utils/dashboard/setup";
import { SetupFields, SetupType } from "src/utils/dashboard/setupDefs";
import { getGuildConfig, setCustomizeConfig, setGuildConfig } from "src/utils/database/guildConfig";
import { assertAuthor } from "src/utils/onlyAuthor";

export default class SetupModalSubmit extends ModalCommand {
  customId = /^modal_submit_setup_(welcome|leave|log|anonymous|qotd)$/;

  async run(ctx: ModalContext) {
    if (!ctx.guildId) return;
    if (!(await assertAuthor(ctx))) return;

    const match = ctx.customId.match(/^modal_submit_setup_(\w+)$/);
    const type = match?.[1] as SetupType | undefined;
    if (!type || !SetupFields[type]) return;

    const prevcfg = type === "anonymous" ? getGuildConfig(ctx.guildId) : null;

    const gPatch: Record<string, string | null> = {};
    const cPatch: Record<string, string | null> = {};

    for (const def of SetupFields[type]) {
      const raw = ctx.getInputValue(def.inputId);
      const val = def.isSelect
        ? (Array.isArray(raw) && raw.length > 0 ? raw[0] : null)
        : (typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null);

      (def.target === "guild" ? gPatch : cPatch)[def.column] = val;
    }

    if (Object.keys(gPatch).length) setGuildConfig(ctx.guildId, gPatch);
    if (Object.keys(cPatch).length) setCustomizeConfig(ctx.guildId, cPatch);

    if (type === "anonymous" && "anonymous_channel" in gPatch) {
      updateAnonChCache(gPatch.anonymous_channel, ctx.guildId, prevcfg?.anonymous_channel);
    }

    await ctx.deferUpdate();

    const guild = await ctx.client.guilds.fetch(ctx.guildId).catch(() => null);
    const msg = ctx.interaction.message;
    if (msg && guild) {
      const ch = await ctx.client.channels.fetch(msg.channelId).catch(() => null);
      if (ch && ch.isTextable()) {
        await ch.messages.edit(msg.id, setupDashboard(guild)).catch(() => null);
      }
    }
  }
}

