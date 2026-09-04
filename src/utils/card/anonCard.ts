import {
  ActionRow,
  Button,
  ButtonStyle,
  Container,
  MediaGallery,
  MediaGalleryItem,
  Section,
  Separator,
  TextDisplay,
  Thumbnail,
} from 'seyfert';
import { ResolvedAnonAttachment } from '../files/anonAttach';
import { truncate } from '../formatter/label';

export interface AnonLogCardInput {
  logId: number;
  guildId: string;
  channelId: string;
  userId: string;
  userAvatarUrl?: string;
  content: string;
  webhookMessageId?: string;
  attachments: ResolvedAnonAttachment[];
  deleted?: boolean;
  deletedBy?: string;
}

export function anonlogCard(inp: AnonLogCardInput): Container {
  const text = new TextDisplay().setContent(
    [
      `## Anonymous Message Log`,
      `User: <@${inp.userId}> (\`${inp.userId}\`)`,
      `Channel: <#${inp.channelId}>`,
      ``,
      `Content:\n${truncate(inp.content, 1200)}`,
    ].join('\n'),
  );

  const header = inp.userAvatarUrl
    ? new Section()
        .addComponents(text)
        .setAccessory(
          new Thumbnail()
            .setMedia(inp.userAvatarUrl)
            .setDescription('User Avatar'),
        )
    : new Section().addComponents(text);

  // USING UNION ARRAY, YOU CAN USE container.addComponents BUT I DECIDED TO USE UNION ARRAY
  const components: (Section | Separator | MediaGallery | ActionRow<Button>)[] =
    [header];

  // PUSH SEPARATOR BEFORE BUTTON, ETC.
  components.push(new Separator());

  const img = inp.attachments.filter((a) => a.isImage);
  if (img.length > 0) {
    const gallery = new MediaGallery().addItems(
      ...img.map((i) =>
        new MediaGalleryItem().setMedia(`attachment://${i.filename}`),
      ),
    );
    components.push(gallery);
  }

  if (inp.deleted) {
    components.push(
      new Section().addComponents(
        new TextDisplay().setContent(`-# Deleted by <@${inp.deletedBy}>`),
      ),
    );
  } else {
    const btn = new ActionRow<Button>().addComponents(
      new Button()
        .setStyle(ButtonStyle.Danger)
        .setLabel('Delete Message')
        .setCustomId(`anonlog:delete:${inp.logId}`)
        .setDisabled(!inp.webhookMessageId),
    );

    if (inp.webhookMessageId) {
      btn.addComponents(
        new Button()
          .setStyle(ButtonStyle.Link)
          .setLabel('View Message')
          .setURL(
            `https://discord.com/channels/${inp.guildId}/${inp.channelId}/${inp.webhookMessageId}`,
          ),
      );

      btn.addComponents(
        new Button()
          .setStyle(ButtonStyle.Secondary)
          .setLabel('Copy UserID')
          .setCustomId(`copyid_${inp.userId}`),
      );
    }

    components.push(btn);
  }

  return new Container().addComponents(...components);
}
