import { ComponentCommand, ComponentType, MessageFlags, type ComponentContext } from "seyfert";
import { getAnonLog, getAnonWebhook, markAnonLogDeleted } from "src/utils/database/anonymousDB";

export default class AnonLogDeleteButton extends ComponentCommand {
  componentType = "Button" as const;
  customId = /^anonlog:delete:\d+$/;

  async run(ctx: ComponentContext<"Button">) {
    if (!ctx.member?.permissions.has(["ManageMessages"])) {
      return ctx.write({
        content: "You do not have permission to use this button.",
        flags: MessageFlags.Ephemeral,
      });
    }

    await ctx.deferUpdate();

    const logId = Number(ctx.customId.split(":")[2]);
    const log = getAnonLog(logId);

    if (!log || !log.webhook_message_id) {
      return ctx.editOrReply({
        components: [],
        content: "This log does not exist.",
      });
    }

    const webhook = getAnonWebhook(log.channel_id);
    if (webhook) {
      await ctx.client.webhooks
        .deleteMessage({
          webhookId: webhook.id,
          token: webhook.token,
          messageId: log.webhook_message_id,
        })
        .catch(() => null);
    }
    
    markAnonLogDeleted(logId);

    const container = ctx.message.components?.[0]?.toJSON() as any;
    if (!container || container.type !== ComponentType.Container) return;

    const kCompo = container.components.filter(
      (c: any) => c.type !== ComponentType.ActionRow
    );
    kCompo.push({
      type: ComponentType.TextDisplay,
      content: `-# Deleted by <@${ctx.author.id}>`,
    });

    await ctx.editOrReply({
      components: [{...container, components: kCompo}],
      flags: MessageFlags.IsComponentsV2,
    })
  }
}
