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
    return ctx.customId.startsWith('userunban_');
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const userid = ctx.customId.replace('userunban_', '');
    const guildId = ctx.guildId!;
    const memPerms = ctx.member?.permissions;

    if (!memPerms?.has(PermissionFlagsBits.BanMembers)) {
      return ctx.write({
        content: 'You do not have permission to unban users.',
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      await ctx.client.proxy
        .guilds(guildId)
        .bans(userid)
        .delete({
          reason: `Unbanned via quick button by ${ctx.author.username} (${ctx.author.id})`,
        });

      await ctx.write({
        content: `${Formatter.userMention(userid)} is unbanned by ${Formatter.userMention(ctx.author.id)}.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (e) {
      console.error('Failed to ban user:', e);
      await ctx.write({
        content: `Failed to unban ${Formatter.userMention(userid)}.\n\nReason: ${e}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
