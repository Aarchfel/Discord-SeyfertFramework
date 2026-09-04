import { ActionRow, Button, ButtonStyle, Container, type Guild, MessageFlags, Separator, TextDisplay, Section, Thumbnail } from "seyfert";
import { getCustomizeConfig, getGuildConfig } from "../database/guildConfig";
import { listAvailablePlaceholders } from "../formatter/placeholder";

const fChannel = (id: string | null) => (id ? `<#${id}>` : "Not set");
 
const fText = (val: string | null) =>
  val ? `\`${val.slice(0, 40)}${val.length > 40 ? "..." : ""}\`` : "Not set";

const fImage = (val: string | null) =>
  val ? "Custom Image have been set" : "Using default image";

const fRole = (id: string | null) => (id ? `<@&${id}>` : "Not set");

export function setupDashboard(guild: Guild<any>) {
  const cfg = getGuildConfig(guild.id);
  const customizeCfg = getCustomizeConfig(guild.id);
  const avatar = guild.iconURL({ extension: "png", size: 1024 });

  const text = [
    `# Server Setup ${guild.name}`,
    `**Configure core channels & roles with modals, pick a button below to configure**`,
    ``,
    `## I. Join Section`,
    `> Welcome Channel: ${fChannel(cfg.welcome_channel)}`,
    `> Welcome Color: ${fText(customizeCfg.welcome_color)}`,
    `> Welcome Message: ${fText(customizeCfg.welcome_message)}`,
    `> Welcome Image: ${fImage(customizeCfg.welcome_image)}`,
    `> Greet Message: ${fText(customizeCfg.greet_message)}`,
    `> Default Role: ${fRole(cfg.default_role)}`,
    `## II. Leave Section`,
    `> Leave Channel: ${fChannel(cfg.leave_channel)}`,
    `> Leave Color: ${fText(customizeCfg.leave_color)}`,
    `> Leave Message: ${fText(customizeCfg.leave_message)}`,
    `> Leave Image: ${fImage(customizeCfg.leave_image)}`,
    `## III. Log Section`,
    `> Log Channel: ${fChannel(cfg.log_channel)}`,
    `> Log Mention: ${fText(cfg.log_mention)} // To add this command please use \`/logsetup\``,
    `## IV. Anonymous Section`,
    `> Anonymous Channel: ${fChannel(cfg.anonymous_channel)}`,
    `> Anonymous Log Channel: ${fChannel(cfg.anonymouslog_channel)}`,
    `## V. Question Of The Day`,
    `> QOTD Channel: ${fChannel(cfg.qotd_channel)}`,
  ].join("\n");

  const format = listAvailablePlaceholders().join(" - ");

  const sect = new Section()
    .setComponents(new TextDisplay().setContent(text))

  if (avatar) sect.setAccessory(new Thumbnail().setMedia(avatar));

  const row1 = new ActionRow<Button>().addComponents(
    new Button()
      .setLabel("Edit Welcome Embed")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("👋")
      .setCustomId("modal_setup_welcome"),

    new Button()
      .setLabel("Edit Leave Embed")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("👋")
      .setCustomId("modal_setup_leave"),

    new Button()
      .setLabel("Edit Log Embed")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("📂")
      .setCustomId("modal_setup_log"),

    new Button()
      .setLabel("Edit Anonymous Embed")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🎭")
      .setCustomId("modal_setup_anonymous"),
      
    new Button()
      .setLabel("Edit QOTD Embed")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("❔")
      .setCustomId("modal_setup_qotd"),
  );
  
  const row2 = new ActionRow<Button>().addComponents(
    new Button()
      .setLabel("Set Welcome Image")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🖼️")
      .setCustomId("customize_set_welcome_image"),
    new Button()
      .setLabel("Set Leave Image")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🖼️")
      .setCustomId("customize_set_leave_image"),
  );

  const row3 = new ActionRow<Button>().addComponents(
    new Button()
      .setLabel("Reset Welcome Image")
      .setCustomId("customize_reset_welcome_image")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(!customizeCfg.welcome_image),

    new Button()
      .setLabel("Reset Leave Image")
      .setCustomId("customize_reset_leave_image")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(!customizeCfg.leave_image),
  );

  const row4 = new ActionRow<Button>().addComponents(
    // TODO: Make customId button_close work with every reply, editOrReply etc. and make it replied with close
    new Button()
      .setLabel("Done")
      .setStyle(ButtonStyle.Success)
      .setEmoji("✅")
      .setCustomId("button_close"),
  );

  const container = new Container().addComponents(
    sect,
    new Separator(),
    new TextDisplay().setContent(`## Available Placeholders\n${format}`),
    new Separator(),
    row1,
    row2,
    row3,
    row4,
  );

  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}
