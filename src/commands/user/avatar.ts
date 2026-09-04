import {
  Command,
  createUserOption,
  type CommandContext,
  Declare,
  Options,
  Container,
  Thumbnail,
  MessageFlags,
  MediaGallery,
  Section,
  Button,
  ButtonStyle,
  TextDisplay,
  Separator,
} from "seyfert";
import { Cooldown } from '@slipher/cooldown';

const opt = {
  target: createUserOption({
    description: 'The user to get the avatar of',
    required: false,
  })
};

@Declare({
  name: 'avatar',
  description: 'Get the avatar of a user',
  aliases: ['avatar', 'av'],
  integrationTypes: ['GuildInstall', 'UserInstall'],
})
@Options(opt)
@Cooldown.user(10_000)
export default class AvatarCommand extends Command {
  async run(ctx: CommandContext<typeof opt>) {
    const user = ctx.options.target ?? ctx.author;
    const avatarUrl = user.avatarURL({size: 1024, extension: 'png'});

    const container = new Container().addComponents(
      new TextDisplay().setContent(`# @${user.username}'s Avatar`),
      new TextDisplay().setContent(`### User ID: \`\`${user.id}\`\``),

      new Separator(),

      new MediaGallery().addItems(
        new Thumbnail().setMedia(avatarUrl)
      ),

      new Section()
        .addComponents(
          new TextDisplay().setContent(`Avatar of \`${user.username}\``)
        )
        .setAccessory(
          new Button()
          .setLabel('Open Avatar')
          .setStyle(ButtonStyle.Link)
          .setURL(avatarUrl)
        )
    );

    await ctx.write({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
}
