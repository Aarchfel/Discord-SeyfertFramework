import { ComponentCommand, type ComponentContext, MessageFlags } from "seyfert";

export default class CopyIdUserinfo extends ComponentCommand {
  componentType = 'Button' as const;
  filter(ctx: ComponentContext) {
    return ctx.customId.startsWith('copyid_');
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const userid = ctx.customId.replace('copyid_', '');

    await ctx.write({
      content: `${userid}`,
      flags: MessageFlags.Ephemeral
    });
  }
}