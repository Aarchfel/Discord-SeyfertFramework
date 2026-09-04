import { Separator, Spacing } from 'seyfert';
import {
  ActionRow,
  Button,
  ButtonStyle,
  Container,
  RoleSelectMenu,
  TextDisplay,
} from 'seyfert';
import { AuditEvents } from 'src/utils/auditlog/auditEvents';
import { getEventDef } from 'src/utils/auditlog/registry';
import { AuditlogService } from 'src/utils/database/auditlogService';

// ================================================
//              Dashboard - EVENT VIEW
// ================================================

export function renderEventView(gId: string, eventKey: string): Container {
  const def = getEventDef(eventKey) ?? AuditEvents.messageDelete;
  const state = AuditlogService.getEventState(gId, eventKey);

  const items: any[] = [
    new TextDisplay().setContent(
      [
        `## ${def.emoji} ${def.label}`,
        def.description,
        '',
        `Enabled: ${state.enabled ? '[ ✅ ] ' : '[ ❌ ] '}`,
        `Ping role: ${state.pingRoleId ? `<@&${state.pingRoleId}>` : 'N/A'}`,
        def.implemented
          ? ''
          : '\n!! *Listener have not been made, so this event will not work until the listener is made*',
      ].join('\n'),
    ),
  ];

  const toggleBtn = new Button()
    .setCustomId(`alog:evt:toggle:${def.key}`)
    .setStyle(state.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
    .setLabel(state.enabled ? 'Disable' : 'Enable');

  items.push(new ActionRow<Button>().setComponents([toggleBtn]));

  const roleSel = new RoleSelectMenu()
    .setCustomId(`alog:evt:pingrole:${def.key}`)
    .setPlaceholder('Select role to ping (empty to disable)')
    .setValuesLength({ min: 0, max: 1 });

  if (state.pingRoleId) roleSel.setDefaultRoles(state.pingRoleId);

  items.push(new ActionRow<RoleSelectMenu>().setComponents([roleSel]));

  items.push(new Separator().setDivider(true).setSpacing(Spacing.Small));

  const backBtn = [
    new Button()
      .setCustomId(`alog:back:cat:${def.category}`)
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
