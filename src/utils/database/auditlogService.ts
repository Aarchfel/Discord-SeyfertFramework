import { DatabaseService } from "src/services/database/database";
import { type AuditEventKey, type AuditCategory } from "../auditlog/registry";
import { AuditEvents } from "../auditlog/auditEvents";

export interface AuditGuildConfigRow {
  guild_id: string;
  enabled: number;
  default_channel: string | null;
}

export interface AuditCategoryChannelRow {
  guild_id: string;
  category: string;
  channel_id: string;
}

export interface AuditEventRow {
  guild_id: string;
  event_key: string;
  category: string;
  enabled: number;
  pingrole_id: string | null;
}

export interface EventState {
  enabled: boolean;
  pingRoleId: string | null;
}

export class AuditlogService {
  // --- GUILD CONFIG (MASTER SWITCH & DEFAULT CHANNEL)
  static getGuildConfig(gId: string): AuditGuildConfigRow {
    const row = DatabaseService.get<AuditGuildConfigRow>("admin", "auditlog_configs", {guild_id: gId});
    return row ?? {guild_id: gId, enabled: 0, default_channel: null};
  }

  static isEnabled(gId: string): boolean {
    const row = this.getGuildConfig(gId);
    return row.enabled === 1;
  }

  static setEnabled(gId: string, enabled: boolean) {
    DatabaseService.set("admin", "auditlog_configs", gId, {enabled: enabled ? 1 : 0}, ["guild_id"]);
  }

  static setDefaultChannel(gId: string, cId: string | null) {
    DatabaseService.set("admin", "auditlog_configs", gId, {default_channel: cId}, ["guild_id"]);
  }

  // --- PERCATEGORY CHANNEL OVERRIDE
  static getCategoryChannel(gId: string, category: AuditCategory): string | null {
    const row = DatabaseService.get<AuditCategoryChannelRow>("admin", "auditlog_channels", {guild_id: gId, category});
    return row?.channel_id ?? null;
  }

  static setCategoryChannel(gId: string, category: AuditCategory, cId: string) {
    DatabaseService.set("admin", "auditlog_channels", [gId, category], {channel_id: cId}, ["guild_id", "category"]);
  }

  static clearCategoryChannel(gId: string, category: AuditCategory) {
    DatabaseService.delete("admin", "auditlog_channels", {guild_id: gId, category});
  }

  // CHANNEL RESOLVER OVERRIDE IF EXISTS, ELSE DEFAULT
  static resolveChannel(gId: string, category: AuditCategory): string | null {
    return this.getCategoryChannel(gId, category) ?? this.getGuildConfig(gId).default_channel;
  }

  // --- PEREVENT ENABLED + PING pingRoleId
  static getEventState(gId: string, eventKey: string): EventState {
    const row = DatabaseService.get<AuditEventRow>("admin", "auditlog_events", {guild_id: gId, event_key: eventKey});
    if (!row) return {enabled: false, pingRoleId: null};
    return {enabled: row.enabled === 1, pingRoleId: row.pingrole_id};
  }

  static getGuildEventRows(gId: string): Map<string, AuditEventRow> {
    const rows = DatabaseService.getAll<AuditEventRow>("admin", "auditlog_events", {guild_id: gId});
    return new Map(rows.map((r) => [r.event_key, r]));
  }

  static setEventEnabled(gId: string, eventKey: AuditEventKey, enabled: boolean) {
    const def = AuditEvents[eventKey];
    const curr = this.getEventState(gId, eventKey);
    DatabaseService.set(
      "admin",
      "auditlog_events",
      [gId, eventKey],
      {
        category: def.category,
        enabled: enabled ? 1 : 0,
        pingrole_id: curr.pingRoleId,
      },
      ["guild_id", "event_key"]
    );
  }

  static toggleEventEnabled(gId: string, eventKey: AuditEventKey): EventState {
    const curr = this.getEventState(gId, eventKey);
    this.setEventEnabled(gId, eventKey, !curr.enabled);
    return {enabled: !curr.enabled, pingRoleId: curr.pingRoleId};
  }

  static setEventPingRole(gId: string, eventKey: AuditEventKey, roleId: string | null) {
    const def = AuditEvents[eventKey];
    const curr = this.getEventState(gId, eventKey);
    DatabaseService.set(
      "admin",
      "auditlog_events",
      [gId, eventKey],
      {
        category: def.category,
        enabled: curr.enabled ? 1 : 0,
        pingrole_id: roleId,
      },
      ["guild_id", "event_key"]
    );
  }
}
