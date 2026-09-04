import { UsingClient } from "seyfert";
import { getAnonWebhook, saveAnonWebhook } from "./database/anonymousDB";

const webhookCache = new Map<string, {id: string; token: string}>();

export async function getCreateAnonWebhook(client: UsingClient, cId: string, gId: string) {
  const cached = webhookCache.get(cId);
  if (cached) return cached;

  const stored = getAnonWebhook(cId);
  if (stored) {
    webhookCache.set(cId, stored);
    return stored;
  }

  const webhook = await client.webhooks.create(cId, {name: "Anonymous Chat"});
  
  const dat = {id: webhook.id, token: webhook.token!};

  saveAnonWebhook(cId, gId, dat.id, dat.token);
  webhookCache.set(cId, dat);
  return dat;
}

export function invalidateAnonWebhook(cId: string) {
  webhookCache.delete(cId);
}
