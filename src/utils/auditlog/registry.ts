import { AuditEvents } from "./auditEvents";

export const AuditCategories = {
  msg_log: {label: "Message Logs", emoji: "📜"},
  member_log: {label: "Member Logs", emoji: "👥"},
  mod_log: {label: "Moderation Logs", emoji: "🚨"},
  voice_log: {label: "Voice Logs", emoji: "🔊"},
  channel_role_log: {label: "Channel & Role Logs", emoji: "📂"},
  server_log: {label: "Server Logs", emoji: "🌐"},
} as const;

export type AuditCategory = keyof typeof AuditCategories;
  
export interface AuditEventDefs {
  // PRIMARY KEY DATABASE AND CUSTOMID
  key: string;
  label: string;
  category: AuditCategory;
  emoji: string;
  description: string;
  // SET IT TO TRUE IF THIS EVENT IS IMPLEMENTED ON LISTENER
  implemented: boolean;
}

// NOTE: AuditEvents on auditEvents.ts

export type AuditEventKey = keyof typeof AuditEvents;

export function getEventDef(key: string): AuditEventDefs | undefined {
  return (AuditEvents as Record<string, AuditEventDefs>)[key];
}

export function getEventsbyCategory(category: AuditCategory): AuditEventDefs[] {
  return Object.values(AuditEvents).filter((e) => e.category === category);
}

export function getAllEventKeys(): string[] {
  return Object.keys(AuditEvents);
}
