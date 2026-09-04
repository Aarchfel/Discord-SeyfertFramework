import { DatabaseService } from "src/services/database/database";

// Idfk why did i put webhook_token on general db bru
export interface AnonWebhookRow {
  channel_id: string;
  guild_id: string;
  webhook_id: string;
  webhook_token: string;
}

// Get anonymous webhook, yeah type shi
export function getAnonWebhook(cId: string): {id: string, token: string} | undefined {
  const row = DatabaseService.get<AnonWebhookRow>("general", "anon_webhooks", {
    channel_id: cId,
  });
  if (!row) return undefined;
  return {id: row.webhook_id, token: row.webhook_token};
}

// Save anonymous, needed for webhook anonymous 
export function saveAnonWebhook(cId: string, gId: string, webId: string, webToken: string) {
  return DatabaseService.set(
    "general",
    "anon_webhooks",
    cId,
    {
      channel_id: cId,
      guild_id: gId,
      webhook_id: webId,
      webhook_token: webToken
    }, 
    ["channel_id"],
  );
}

// Sensitive information, e.g, webhook logs, and so on :/
export interface AnonLogRow {
  id: number;
  guild_id: string;
  channel_id: string;
  user_id: string;
  content: string;
  webhook_message_id: string | null;
  log_message_id: string | null;
  created_at: number;
}

// Insert Anonymous type
export interface InsertAnonLogInp {
  guildId: string;
  channelId: string;
  userId: string;
  content: string;
  webhookMessageId?: string;
}

// Insert Anonymous log
export function insertAnonLog(inp: InsertAnonLogInp): number {
  const res = DatabaseService.add("admin", "anon_logs", {
    guild_id: inp.guildId,
    channel_id: inp.channelId,
    user_id: inp.userId,
    content: inp.content,
    webhook_message_id: inp.webhookMessageId ?? null,
    created_at: Date.now(),
  });

  return Number(res.lastInsertRowid);
}

// Set anonlog message id
export function setAnonLogMsgId(logId: number, logMsgId: string) {
  return DatabaseService.update("admin", "anon_logs", {
    log_message_id: logMsgId
  }, {
    id: logId
  });
}

// BY ID
export function getAnonLog(logId: number): AnonLogRow | undefined {
  return DatabaseService.get<AnonLogRow>("admin", "anon_logs", {
    id: logId
  });
}

// Mark this shit as deleted
export function markAnonLogDeleted(logId: number) {
  return DatabaseService.update("admin", "anon_logs", {
    webhook_message_id: null
  }, {
    id: logId
  });
}
