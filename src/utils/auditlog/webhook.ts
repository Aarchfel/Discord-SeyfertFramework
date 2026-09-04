import { DatabaseService } from "src/services/database/database";

interface WebhookRow {
  channel_id: string;
  guild_id: string;
  webhook_id: string;
  webhook_token: string;
}

const webhookName = "Nebula Audit Log";
const apiBase = "https://discord.com/api/v10";

export class WebhookGoneError extends Error {}

async function createDiscordWebhook(cId: string): Promise<{id: string; token: string}> {
  const token = process.env.BOT_TOKEN;
  if (!token) throw new Error("Missing bot token");
  
  const res = await fetch(`${apiBase}/channels/${cId}/webhooks`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({name: webhookName}),
  });

  if (!res.ok) throw new Error(`Failed to create webhook on channel ${cId}: ${res.status} ${await res.text()}`);

  const data = (await res.json()) as {id: string; token: string};
  return {id: data.id, token: data.token};
}

export async function getAuditWebhook(gId: string, cId: string): Promise<{id: string; token: string}> {
  const exist = DatabaseService.get<WebhookRow>("admin", "auditlog_webhooks", {channel_id: cId});
  if (exist) return {id: exist.webhook_id, token: exist.webhook_token};

  const created = await createDiscordWebhook(cId);
  DatabaseService.set(
    "admin",
    "auditlog_webhooks",
    cId,
    {
      guild_id: gId,
      webhook_id: created.id,
      webhook_token: created.token,
    },
    ["channel_id"],
  );

  return created;
}

export function forgetAuditWebhook(cId: string) {
  DatabaseService.delete("admin", "auditlog_webhooks", {channel_id: cId});
}

export async function executeAuditWebhook(wId: string, wToken: string, payload: unknown) {
  const res = await fetch(`${apiBase}/webhooks/${wId}/${wToken}?wait=true`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 404) {
    throw new WebhookGoneError(`Webhook ${wId} gone`);
  }

  if (!res.ok) {
    throw new Error(`Failed to execute webhook ${wId}: ${res.status} ${await res.text()}`);
  }

  return res.json();
}
