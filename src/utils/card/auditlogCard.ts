import {
  ActionRow,
  Button,
  ButtonStyle,
  Container,
  Formatter,
  MediaGallery,
  MediaGalleryItem,
  MessageFlags,
  Separator,
  Spacing,
  TextDisplay,
} from 'seyfert';
import type { AuditCategory, AuditEventDefs } from '../auditlog/registry';
import { discordTimestamp } from '../formatter/label';

const categoryColor: Record<AuditCategory, number> = {
  msg_log: 0x5865f2, // blurple
  member_log: 0x57f287, // green
  mod_log: 0xed4245, // red
  channel_role_log: 0xfee75c, // yellow
  voice_log: 0xeb459e, // pink
  server_log: 0x95a5a6, // gray
};

export type AuditChangeType =
  | 'add'
  | 'remove'
  | 'edit'
  | 'note'
  | 'contentEdit'
  | 'image'
  | 'permOverwrite';

export interface AuditChange {
  type: AuditChangeType;
  text: string;
  before?: string;
  after?: string;
  beforeUrl?: string | null;
  afterUrl?: string | null;
  permLines?: string[];
}

export interface AuditField {
  label: string;
  value: string;
}

export interface AuditButtonDef {
  label: string;
  style: ButtonStyle;
  url?: string;
  customId?: string;
  disabled?: boolean;
  emoji?: string;
}

export interface AuditCardInp {
  event: AuditEventDefs;
  // Who performed the event (mod, user, etc)
  actorTag?: string;
  // Entity that is the target of the event (user, role, channel, etc)
  targetTag?: string;
  fields?: AuditField[];
  changes?: AuditChange[];
  // Warning lines, example "this account is made 3 days ago"
  warningLines?: string[];
  // Specific buttons perevent, example "delete" "jump to channel", etc.
  buttons?: AuditButtonDef[];
  timestampMs?: number;
}

function renderChanges(changes: AuditChange[]): string {
  const lines = changes
    .filter((c) => c.type !== 'image' && c.type !== 'permOverwrite')
    .map((c) => {
      switch (c.type) {
        case 'add':
          return `\`+\` ${c.text}`;
        case 'remove':
          return `\`-\` ${c.text}`;
        case 'edit':
          return `_ _ ${c.text}: ${c.before ?? '?'} \`->\` ${c.after ?? '?'}`;
        case 'contentEdit':
          return `_ _ ${c.text}:\n${c.before ?? '?'}\n\n_ _ To:\n${c.after ?? '?'}`;
        case 'note':
        default:
          return `**${c.text}**`;
      }
    });

  return lines.join('\n');
}

export function auditlogCard(inp: AuditCardInp): Container {
  const {
    event,
    fields = [],
    changes = [],
    warningLines = [],
    buttons = [],
    timestampMs = Date.now(),
  } = inp;

  const items: any[] = [];

  const headerLines = [`## ${event.emoji} ${event.label}`];
  if (inp.actorTag) headerLines.push(`**By:** ${inp.actorTag}`);
  if (inp.targetTag) headerLines.push(`**Target:** ${inp.targetTag}`);
  items.push(new TextDisplay().setContent(headerLines.join('\n')));

  if (warningLines.length) {
    items.push(
      new TextDisplay().setContent(
        warningLines.map((w) => `☢️ ${w}`).join('\n'),
      ),
    );
  }

  if (fields.length) {
    items.push(new Separator().setDivider(true).setSpacing(Spacing.Small));
    items.push(
      new TextDisplay().setContent(
        fields.map((f) => `**${f.label}:** ${f.value}`).join('\n'),
      ),
    );
  }

  const changesT = changes.filter(
    (c) => c.type !== 'image' && c.type !== 'permOverwrite',
  );
  const imgC = changes.filter((c) => c.type === 'image');
  const permC = changes.filter((c) => c.type === 'permOverwrite');

  if (changesT.length) {
    items.push(new Separator().setDivider(true).setSpacing(Spacing.Small));
    items.push(new TextDisplay().setContent(renderChanges(changesT)));
  }

  // IMAGE CHANGES
  for (const ic of imgC) {
    items.push(new Separator().setDivider(true).setSpacing(Spacing.Small));
    items.push(new TextDisplay().setContent(`**${ic.text}**`));

    const gItems = [];
    if (ic.beforeUrl) {
      gItems.push(
        new MediaGalleryItem().setMedia(ic.beforeUrl).setDescription('Before'),
      );
    }

    if (ic.afterUrl) {
      gItems.push(
        new MediaGalleryItem().setMedia(ic.afterUrl).setDescription('After'),
      );
    }

    if (gItems.length) {
      items.push(new MediaGallery().addItems(...gItems));
    } else {
      items.push(new TextDisplay().setContent('Removed'));
    }
  }

  // PERM CHANGES
  const maxPermBlock = 6;
  const permCtoRen = permC.slice(0, maxPermBlock);
  const permCOverflow = permC.length - permCtoRen.length;

  for (const pc of permCtoRen) {
    items.push(new Separator().setDivider(true).setSpacing(Spacing.Small));
    items.push(new TextDisplay().setContent(`**${pc.text}**`));
    items.push(
      new TextDisplay().setContent(
        ['```diff', ...(pc.permLines ?? []), '```'].join('\n'),
      ),
    );
  }

  if (permCOverflow > 0) {
    items.push(new Separator().setDivider(true).setSpacing(Spacing.Small));
    items.push(new TextDisplay().setContent(`And ${permCOverflow} more...`));
  }

  items.push(new Separator().setDivider(false).setSpacing(Spacing.Small));
  items.push(
    new TextDisplay().setContent(
      `-# ${discordTimestamp(new Date(timestampMs))} - \`${event.key}\``,
    ),
  );

  if (buttons.length) {
    const row = new ActionRow<Button>().setComponents(
      buttons.slice(0, 5).map((b) => {
        const btn = new Button().setStyle(b.style).setLabel(b.label);
        if (b.url) btn.setURL(b.url);
        if (b.customId) btn.setCustomId(b.customId);
        if (b.disabled) btn.setDisabled(true);
        if (b.emoji) btn.setEmoji(b.emoji);
        return btn;
      }),
    );

    items.push(row);
  }

  return new Container()
    .addComponents(...items)
    .setColor(categoryColor[event.category]);
}

export function buildAuditMessage(
  container: Container,
  pingRId?: string | null,
) {
  const compo = pingRId
    ? [new TextDisplay().setContent(Formatter.roleMention(pingRId)), container]
    : [container];

  return {
    components: compo,
    flags: MessageFlags.IsComponentsV2,
    allowed_mentions: pingRId ? { parse: [], roles: [pingRId] } : { parse: [] },
  };
}
