import { DatabaseService } from "src/services/database/database";

export interface GuildConfig {
  guild_id: string;
  default_role: string | null;
  welcome_channel: string | null;
  leave_channel: string | null;
  qotd_channel: string | null;
  anonymous_channel: string | null;
  log_channel: string | null;
  log_mention: string | null;
  anonymouslog_channel: string | null;
  sticky_channels: string | null;
}

export interface CustomizeConfig {
  guild_id: string;
  greet_message: string | null;
  welcome_message: string | null;
  welcome_color: string | null;
  welcome_image: string | null;
  leave_message: string | null;
  leave_color: string | null;
  leave_image: string | null;
  sticky_message: string | null;
  sticky_color: string | null;
  selfrole_message: string | null;
  selfrole_color: string | null;
}

const defaultGuildConfig: Omit<GuildConfig, "guild_id"> = {
  default_role: null,
  welcome_channel: null,
  leave_channel: null,
  qotd_channel: null,
  anonymous_channel: null,
  log_channel: null,
  log_mention: null,
  anonymouslog_channel: null,
  sticky_channels: null,
};

const defaultCustomizeConfig: Omit<CustomizeConfig, "guild_id"> = {
  greet_message: null,
  welcome_message: null,
  welcome_color: null,
  welcome_image: null,
  leave_message: null,
  leave_color: null,
  leave_image: null,
  sticky_message: null,
  sticky_color: null,
  selfrole_message: null,
  selfrole_color: null,
};

export function getGuildConfig(guildId: string): GuildConfig {
  const exist = DatabaseService.get<GuildConfig>("general", "guild_configs", {
    guild_id: guildId,
  });
  return exist ?? { guild_id: guildId, ...defaultGuildConfig };
}

export function setGuildConfig(
  guildId: string,
  data: Partial<Omit<GuildConfig, "guild_id">>,
) {
  return DatabaseService.set("general", "guild_configs", guildId, data, [
    "guild_id",
  ]);
}

export function getCustomizeConfig(guildId: string): CustomizeConfig {
  const exist = DatabaseService.get<CustomizeConfig>(
    "general",
    "customize_configs",
    {
      guild_id: guildId,
    },
  );
  return exist ?? { guild_id: guildId, ...defaultCustomizeConfig };
}

export function setCustomizeConfig(
  guildId: string,
  data: Partial<Omit<CustomizeConfig, "guild_id">>,
) {
  return DatabaseService.set("general", "customize_configs", guildId, data, [
    "guild_id",
  ]);
}
