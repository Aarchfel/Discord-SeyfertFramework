import Database from "better-sqlite3";
import type { Database as DatabaseType, Statement } from "better-sqlite3";
import { initSchemas } from "../schemas/schema";

const generalDb: DatabaseType = new Database("data/general.db");
const adminDb: DatabaseType = new Database("data/admin.db");

generalDb.pragma("journal_mode = WAL");
adminDb.pragma("journal_mode = WAL");

initSchemas(generalDb, adminDb);

export type DbTg = "general" | "admin";

export class DatabaseService {
  private static dbInstances(tg: DbTg): DatabaseType {
    return tg === "admin" ? adminDb : generalDb;
  }

  private static stmtGeneral = {
    guildConfig: generalDb.prepare(
      "DELETE FROM guild_configs WHERE guild_id = ?"
    ),
    anonWebhook: generalDb.prepare(
      "DELETE FROM anon_webhooks WHERE guild_id = ?"
    ),
    afks: generalDb.prepare(
      "DELETE FROM afks WHERE guild_id = ?"
    ),
    customizeConfig: generalDb.prepare(
      "DELETE FROM customize_configs WHERE guild_id = ?",
    ),
    guildSelfrole: generalDb.prepare(
      "DELETE FROM guild_selfroles WHERE guild_id = ?",
    ),
  }

  private static stmtAdmin = {
    warns: adminDb.prepare(
      "DELETE FROM warns WHERE guild_id = ?"
    ),
    verifys: adminDb.prepare(
      "DELETE FROM verifys WHERE guild_id = ?"
    ),
    administratorConfig: adminDb.prepare(
      "DELETE FROM administrator_configs WHERE guild_id = ?"
    ),
    anonLogs: adminDb.prepare(
      "DELETE FROM anon_logs WHERE guild_id = ?"
    ),
    auditLogConfig: adminDb.prepare(
      "DELETE FROM auditlog_configs WHERE guild_id = ?"
    ),
    auditLogChannels: adminDb.prepare(
      "DELETE FROM auditlog_channels WHERE guild_id = ?"
    ),
    auditLogEvents: adminDb.prepare(
      "DELETE FROM auditlog_events WHERE guild_id = ?"
    )
  }

  private static purgeGeneralTx = generalDb.transaction((id: string) => {
    this.stmtGeneral.guildConfig.run(id);
    this.stmtGeneral.anonWebhook.run(id);
    this.stmtGeneral.afks.run(id);
    this.stmtGeneral.customizeConfig.run(id);
    this.stmtGeneral.guildSelfrole.run(id);
  })

  private static purgeAdminTx = adminDb.transaction((id: string) => {
    this.stmtAdmin.warns.run(id);
    this.stmtAdmin.verifys.run(id);
    this.stmtAdmin.administratorConfig.run(id);
    this.stmtAdmin.anonLogs.run(id);
    this.stmtAdmin.auditLogConfig.run(id);
    this.stmtAdmin.auditLogChannels.run(id);
    this.stmtAdmin.auditLogEvents.run(id);
  })

  static get<T = any>(
    tg: DbTg,
    table: string,
    condition: Record<string, any>,
  ): T | undefined {
    const db = this.dbInstances(tg);

    const keys = Object.keys(condition);
    const where = keys.map((key) => `${key} = ?`).join(" AND ");
    const val = Object.values(condition);

    const query = `SELECT * FROM ${table} WHERE ${where} LIMIT 1`;
    const statement: Statement = db.prepare(query);

    return statement.get(...val) as T;
  }

  static getAll<T = any>(
    tg: DbTg,
    table: string,
    condition?: Record<string, any>,
  ): T[] {
    const db = this.dbInstances(tg);

    if (!condition || Object.keys(condition).length === 0) {
      return db.prepare(`SELECT * FROM ${table}`).all() as T[];
    }

    const keys = Object.keys(condition);
    const where = keys.map((key) => `${key} = ?`).join(" AND ");
    const val = Object.values(condition);

    const query = `SELECT * FROM ${table} WHERE ${where}`;
    return db.prepare(query).all(...val) as T[];
  }

  static add(tg: DbTg, table: string, data: Record<string, any>) {
    const db = this.dbInstances(tg);

    const keys = Object.keys(data);
    const columns = keys.join(", ");
    const placeholder = keys.map(() => "?").join(", ");
    const val = Object.values(data);

    const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholder})`;
    return db.prepare(query).run(...val);
  }

  static set(
    tg: DbTg,
    table: string,
    key: string | string[],
    data: Record<string, any>,
    pkColNames?: string[],
  ) {
    const db = this.dbInstances(tg);

    const isCom = Array.isArray(key);

    const pkCol =
      pkColNames ?? (isCom ? ["guild_id", "user_id"] : ["guild_id"]);
    const pkVal = isCom ? key : [key];

    const col = Object.keys(data);
    const val = Object.values(data);

    const aCols = [...pkCol, ...col].join(", ");
    const ph = [...pkCol, ...col].map(() => "?").join(", ");
    const update = col
      .map((column) => `${column} = EXCLUDED.${column}`)
      .join(", ");

    const query = `
      INSERT INTO ${table} (${aCols})
      VALUES (${ph})
      ON CONFLICT(${pkCol.join(", ")})
      DO UPDATE SET ${update}
    `;

    return db.prepare(query).run(...pkVal, ...val);
  }

  static update(
    tg: DbTg,
    table: string,
    data: Record<string, any>,
    condition: Record<string, any>,
  ) {
    const db = this.dbInstances(tg);

    const set = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(", ");
    const where = Object.keys(condition)
      .map((key) => `${key} = ?`)
      .join(" AND ");

    const val = [...Object.values(data), ...Object.values(condition)];

    const query = `UPDATE ${table} SET ${set} WHERE ${where}`;
    return db.prepare(query).run(...val);
  }

  static delete(tg: DbTg, table: string, condition: Record<string, any>) {
    const db = this.dbInstances(tg);

    const keys = Object.keys(condition);
    const where = keys.map((key) => `${key} = ?`).join(" AND ");
    const val = Object.values(condition);

    const query = `DELETE FROM ${table} WHERE ${where}`;
    return db.prepare(query).run(...val);
  }

  static purgeGuild(guildId: string) {
   this.purgeGeneralTx(guildId);
   this.purgeAdminTx(guildId);
  }

  static purgeOldAnonLogs(olderMs: number): number {
    const cut = Date.now() - olderMs;
    const res = adminDb.prepare("DELETE FROM anon_logs WHERE created_at < ?").run(cut);
    return res.changes;
  }

  static vacuumAdmin() {
    adminDb.exec("VACUUM");
  }
}
