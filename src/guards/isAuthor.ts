import { createMiddleware } from "seyfert";

export const isAuthor = createMiddleware<void>(
  async ({ context, next, stop }) => {
    const currentUser = context.author.id;

    const component =
      context.interaction.isButton() ||
      context.interaction.isRoleSelectMenu() ||
      context.interaction.isStringSelectMenu() ||
      context.interaction.isChannelSelectMenu() ||
      context.interaction.isUserSelectMenu() ||
      context.interaction.isModal() ||
      context.interaction.isModal();

    if (component) {
      const msg = context.interaction.message;

      const originalAuthor = msg?.interactionMetadata?.user.id;

      if (originalAuthor && currentUser !== originalAuthor) {
        await context.write({
          content: "You are not the author of this message",
          flags: 64,
        });
        return stop();
      }
    }

    return next();
  },
);
