import {
  ActionRow,
  Button,
  ButtonStyle,
  ChannelSelectMenu,
  ChannelType,
  Container,
  Separator,
  Spacing,
  StringSelectMenu,
  StringSelectOption,
  TextDisplay,
} from 'seyfert';
import {
  AuditCategories,
  getEventsbyCategory,
  type AuditCategory,
} from 'src/utils/auditlog/registry';
import { AuditlogService } from 'src/utils/database/auditlogService';

// ================================================
//            Dashboard - CATEGORY VIEW
// ================================================

export function renderCategoryView(
  gId: string,
  category: AuditCategory,
): Container {
  const cat = AuditCategories[category];
  const events = getEventsbyCategory(category);

  if (!cat || events.length === 0) {
    console.error(
      `Invalid category of ${category} is not matched from any category on registry`,
    );

    return new Container().setComponents(
      new TextDisplay().setContent(
        `Invalid category of ${category} is not matched from any category on registry`,
      ),
    );
  }

  const rows = AuditlogService.getGuildEventRows(gId);
  const override = AuditlogService.getCategoryChannel(gId, category);
  const fallback = AuditlogService.getGuildConfig(gId).default_channel;

  const channelL = override
    ? `<#${override}> (override this category)`
    : fallback
      ? `<#${fallback}> (default guild)`
      : '*No channel set*';

  const eventL = events.map((e) => {
    const state = rows.get(e.key);
    const enabled = state?.enabled === 1;
    const ping = state?.pingrole_id ? `<@&${state.pingrole_id}>` : '';
    const flag = e.implemented ? '' : '*(Listener have not been made)*';

    return `${enabled ? '[ ✅ ] ' : '[ ❌ ] '} ${e.emoji} **${e.label}** ${ping}${flag}`;
  });

  const items: any[] = [
    new TextDisplay().setContent(
      [
        `## ${cat.emoji} ${cat.label}`,
        `Channel: ${channelL}`,
        '',
        eventL.join('\n'),
      ].join('\n'),
    ),
  ];

  const eventOpt = events.map((e) =>
    new StringSelectOption()
      .setLabel(e.label)
      .setValue(e.key)
      .setDescription(e.description)
      .setEmoji(e.emoji),
  );

  const eventSel = new StringSelectMenu()
    .setCustomId(`alog:evt:select`)
    .setPlaceholder('Select an event')
    .setOptions(eventOpt);

  items.push(new ActionRow<StringSelectMenu>().setComponents([eventSel]));

  const channelSel = new ChannelSelectMenu()
    .setCustomId(`alog:channel:cat:${category}`)
    .setPlaceholder('Override channel for this category (OPTIONAL)')
    .setChannelTypes([ChannelType.GuildText])
    .setValuesLength({ min: 0, max: 1 });
  if (override) channelSel.setDefaultChannels(override);

  items.push(new ActionRow<ChannelSelectMenu>().setComponents([channelSel]));

  items.push(new Separator().setDivider(true).setSpacing(Spacing.Small));

  const backBtn = [
    new Button()
      .setCustomId('alog:back:main')
      .setStyle(ButtonStyle.Secondary)
      .setLabel('Back')
      .setEmoji('⬅️'),

    new Button()
      .setCustomId('button_close')
      .setStyle(ButtonStyle.Danger)
      .setLabel('Close'),
  ];
  items.push(new ActionRow<Button>().setComponents(backBtn));

  return new Container().addComponents(...items);
}
