import { ComponentCommand, Container, MessageFlags, TextDisplay, type ComponentContext } from "seyfert";
import { assertAuthor } from "src/utils/onlyAuthor";

export default class ButtonClose extends ComponentCommand {
  componentType = "Button" as const;

  filter(ctx: ComponentContext) {
    return ctx.customId === "button_close";
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    if (!(await assertAuthor(ctx))) return;

    const msg = ctx.interaction.message;
    if (!msg) return;

    const flags = msg.flags ?? 0;
    
    const isEphemeral = (flags & MessageFlags.Ephemeral) === MessageFlags.Ephemeral;
    const isCV2 = (flags & MessageFlags.IsComponentsV2) === MessageFlags.IsComponentsV2;

    if (isEphemeral) {
      await msg.delete().catch(() => null);
      return;
    }

    const resp = new Container().setComponents(
        new TextDisplay().setContent("Interaction Finished, message closed.")
      )

    if (isCV2) {
      await ctx.update({
        content: undefined,
        embeds: [],
        components: [resp],
        flags: msg.flags,
      });
      return;
    }

    await ctx.update({
      content: "Interaction Finished, message closed.",
      components: [],
      embeds: [],
      flags: msg.flags,
    });
  } 
}
