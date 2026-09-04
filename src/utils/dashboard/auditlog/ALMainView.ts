import { ActionRow, Button, ButtonStyle, ChannelSelectMenu, ChannelType, Container, MessageFlags, Separator, Spacing, StringSelectMenu, StringSelectOption, TextDisplay } from "seyfert";
import { AuditCategories, type AuditCategory, getEventsbyCategory } from "src/utils/auditlog/registry";
import { AuditlogService } from "src/utils/database/auditlogService";

export function dashboardPayload(container: Container) {
  return {components: [container], flags: MessageFlags.IsComponentsV2};
}

// ================================================
//              Dashboard - MAIN VIEW
// ================================================

export function renderMainView(gId: string): Container {
  const config = AuditlogService.getGuildConfig(gId);
  const rows = AuditlogService.getGuildEventRows(gId);

  const statusL = config.enabled ? "**ON**" : "**OFF**";
  const channelL = config.default_channel ? `<#${config.default_channel}>` : "N/A";

  const items: any[] = [
    new TextDisplay().setContent(
      [
        "## Audit Log Setup",
        `Status: ${statusL}`,
        `Default log channel: ${channelL}`,
        "",
        "Select category below to set which events should be logged and which roles should be pinged.",
      ].join("\n")
    ),
    new Separator().setDivider(true).setSpacing(Spacing.Small),
  ];
  
  const categoryOpt: StringSelectOption[] = [];
  const overviewL: string[] = [];

  for (const [id, cat] of Object.entries(AuditCategories) as [AuditCategory, (typeof AuditCategories)[AuditCategory]][]) {
    const events = getEventsbyCategory(id);
    const activeCount = events.filter((e) => rows.get(e.key)?.enabled === 1).length;
    overviewL.push(`${cat.emoji} **${cat.label}** - ${activeCount}/${events.length} event activated.`);
    categoryOpt.push(
      new StringSelectOption()
        .setLabel(cat.label)
        .setValue(id)
        .setDescription(`${activeCount}/${events.length} event activated.`)
        .setEmoji(cat.emoji),
    );
  }

  items.push(new TextDisplay().setContent(overviewL.join("\n")));

  const categorySel = new StringSelectMenu()
    .setCustomId("alog:cat:select")
    .setPlaceholder("Select a category")
    .setOptions(categoryOpt);

  items.push(new ActionRow<StringSelectMenu>().setComponents([categorySel]));

  const channelSel = new ChannelSelectMenu()
    .setCustomId("alog:channel:default")
    .setPlaceholder("Select default log channel")
    .setChannelTypes([ChannelType.GuildText])
    .setValuesLength({min: 0, max: 1});

  if (config.default_channel) channelSel.setDefaultChannels(config.default_channel);

  items.push(new ActionRow<ChannelSelectMenu>().setComponents([channelSel]));

  const masterBtn = [
    new Button()
      .setCustomId("alog:master:toggle")
      .setStyle(config.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
      .setLabel(config.enabled ? "Disable Auditlog" : "Enable Auditlog"),

    new Button()
      .setCustomId("button_close")
      .setStyle(ButtonStyle.Danger)
      .setLabel("Close"),
  ];
  items.push(new ActionRow<Button>().setComponents(masterBtn));


  return new Container().addComponents(...items);
}


