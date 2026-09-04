import {
  ComponentCommand,
  type ComponentContext,
  MessageFlags,
  Formatter,
  PermissionFlagsBits,
} from 'seyfert';

export default class CopyIdUserinfo extends ComponentCommand {
  componentType = 'Button' as const;
  filter(ctx: ComponentContext) {
    return ctx.customId.startsWith('userban_');
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    if (!ctx.guildId) return;
    const userid = ctx.customId.replace('userban_', '');
    const guildId = ctx.guildId!;
    const memPerms = ctx.member?.permissions;

    if (!memPerms?.has(PermissionFlagsBits.BanMembers)) {
      return ctx.write({
        content: 'You do not have permission to ban users.',
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      await ctx.client.proxy
        .guilds(guildId)
        .bans(userid)
        .put({
          body: { deleted_message_seconds: 24 * 60 * 60 * 1000 },
          reason: `Banned via quick button by ${ctx.author.username} (${ctx.author.id})`,
        });

      await ctx.write({
        content: `${Formatter.userMention(userid)} has been banned by ${Formatter.userMention(ctx.author.id)}.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (e) {
      console.error('Failed to ban user:', e);
      await ctx.write({
        content: `Failed to ban ${Formatter.userMention(userid)}.\n\nReason: ${e}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
