import { LRUCache } from "lru-cache";
import { MessageFlags, type ComponentContext, type ModalContext } from "seyfert";

const author = new LRUCache<string, string>({ max: 500, ttl: 30 * 60 * 1000 });

export function registerAuthor(msgId: string, authorId: string) {
  author.set(msgId, authorId);
}

export async function assertAuthor(ctx: ComponentContext | ModalContext): Promise<boolean> {
  const msgId = ctx.interaction.message?.id;
  if (!msgId) return true;

  const authorId = author.get(msgId);
  if (!authorId) return true;

  if (authorId !== ctx.author.id) {
    await ctx.editOrReply({
      content: "You are not the author of this message.",
      flags: MessageFlags.Ephemeral,
    });
    return false;
  }

  return true;
}
