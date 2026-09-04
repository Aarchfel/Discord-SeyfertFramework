import type { Database as DatabaseType } from "better-sqlite3";

export function initSchemas(generalDb: DatabaseType, adminDb: DatabaseType) {
  generalDb.exec(`
    CREATE TABLE IF NOT EXISTS guild_configs (
      guild_id TEXT PRIMARY KEY,
      default_role TEXT DEFAULT NULL,
      welcome_channel TEXT DEFAULT NULL,
      leave_channel TEXT DEFAULT NULL,
      qotd_channel TEXT DEFAULT NULL,
      anonymous_channel TEXT DEFAULT NULL,
      log_channel TEXT DEFAULT NULL,
      log_mention TEXT DEFAULT NULL,
      anonymouslog_channel TEXT DEFAULT NULL,
      sticky_channels TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS anon_webhooks (
      channel_id TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      webhook_id TEXT NOT NULL,
      webhook_token TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS afks (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      reason TEXT DEFAULT NULL,
      timestamp INTEGER NOT NULL,
      PRIMARY KEY (guild_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS customize_configs (
      guild_id TEXT PRIMARY KEY,
      greet_message TEXT DEFAULT NULL,
      welcome_message TEXT DEFAULT NULL,
      welcome_color TEXT DEFAULT NULL,
      welcome_image TEXT DEFAULT NULL,
      leave_message TEXT DEFAULT NULL,
      leave_color TEXT DEFAULT NULL,
      leave_image TEXT DEFAULT NULL,
      sticky_message TEXT DEFAULT NULL,
      sticky_color TEXT DEFAULT NULL,
      selfrole_message TEXT DEFAULT NULL,
      selfrole_color TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS guild_selfroles (
      guild_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      role_name TEXT DEFAULT NULL,
      PRIMARY KEY (guild_id, role_id)
    );
  `);

  adminDb.exec(`
    CREATE TABLE IF NOT EXISTS warns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      mod_id TEXT NOT NULL,
      reason TEXT DEFAULT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS verifys (
      guild_id TEXT PRIMARY KEY,
      unverified_role TEXT NOT NULL,
      verified_role TEXT NOT NULL,
      verify_channel TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS anon_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT,
      webhook_message_id TEXT,
      log_message_id TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_anon_logs_guild ON anon_logs(guild_id);
    CREATE INDEX IF NOT EXISTS idx_anon_logs_channel ON anon_logs(channel_id);
    CREATE INDEX IF NOT EXISTS idx_anon_logs_created ON anon_logs(created_at);

    CREATE TABLE IF NOT EXISTS auditlog_configs (
      guild_id TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL DEFAULT 0,
      default_channel TEXT DEFAULT NULL
    );

    -- PERCATEGORY EVENT OVERRIDE CHANNELS
    CREATE TABLE IF NOT EXISTS auditlog_channels (
      guild_id TEXT NOT NULL,
      category TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      PRIMARY KEY (guild_id, category)
    );

    CREATE TABLE IF NOT EXISTS auditlog_events (
      guild_id TEXT NOT NULL,
      event_key TEXT NOT NULL,
      category TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 0,
      pingrole_id TEXT DEFAULT NULL,
      PRIMARY KEY (guild_id, event_key)
    );

    CREATE INDEX IF NOT EXISTS idx_audit_events_guild ON auditlog_events(guild_id);
    CREATE INDEX IF NOT EXISTS idx_audit_events_guild_category ON auditlog_events(guild_id, category);
    CREATE INDEX IF NOT EXISTS idx_audit_category_channels_guild ON auditlog_channels(guild_id);

    CREATE TABLE IF NOT EXISTS auditlog_webhooks (
      channel_id TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      webhook_id TEXT NOT NULL,
      webhook_token TEXT NOT NULL
    );
  `);

  console.log("Schemas initialized");
}
