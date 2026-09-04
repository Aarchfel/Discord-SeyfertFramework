import type { AnyContext, ComponentContext, ModalContext } from "seyfert";

export async function refreshDashboard(ctx: AnyContext, payload: any, tgMsgId?: string, tgChId?: string) {
  const compoCtx = ctx as ComponentContext | ModalContext;

  if (!tgMsgId && !tgChId) {
    return await compoCtx.editOrReply(payload).catch((err: unknown) => {
      console.error("[refreshDashboard] Failed to edit via interaction context:", err);
    });
  }

  let msgId = tgMsgId;
  let chId = tgChId;

  if (!msgId || !chId) {
    const original = compoCtx.interaction?.message;
    msgId = msgId ?? original?.id;
    chId = chId ?? original?.channelId;
  }

  if (!msgId || !chId) {
    console.warn("[refreshDashboard] Failed to resolve message or channelId");
    return;
  }

  await ctx.client.messages
    .edit(chId, msgId, payload)
    .catch((err: unknown) => console.error("[refreshDashboard] Failed to edit dashboard:", err));
}
