import {
  Command,
  type CommandContext,
  Container,
  createUserOption,
  Declare,
  MessageFlags,
  Options,
  Section,
  TextDisplay,
  Thumbnail,
  Separator,
} from 'seyfert';
import { Cooldown } from '@slipher/cooldown';

const opt = {
  target: createUserOption({ description: 'Target user', required: false }),
};

@Declare({
  name: 'gayrate',
  description: 'Rate how gay is someone',
  aliases: ['gayrate', 'grate'],
  integrationTypes: ['GuildInstall', 'UserInstall'],
})
@Options(opt)
@Cooldown.user(10_000)
export default class GayrateCommand extends Command {
  async run(ctx: CommandContext<typeof opt>) {
    const tg = ctx.options.target ?? ctx.author;
    const today = new Date().toISOString().slice(0, 10);

    const avatar =
      tg.avatarURL({ size: 1024, extension: 'png' }) ?? tg.defaultAvatarURL;

    const seed = `${tg.id}${today}_Gayr`;

    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const r = Math.abs(hash) % 101;

    let bar =
      '🟦'.repeat(Math.floor(r / 10)) + '⬛'.repeat(10 - Math.floor(r / 10));

    let resp: string;
    if (r <= 20) {
      resp = 'Oooo, is he gay?';
    } else if (r <= 70) {
      resp = 'Omagad, does he loves man?';
    } else {
      resp = 'Holy shit this guy is gay';
    }

    const text = [
      `# Gay Rate / ${tg.username}`,
      `### Is ${tg.tag} gay?🤔\n`,
      `The answer is.....`,
    ].join('\n');

    const textBar = [`## ${r}/100?? ${resp}`, `[ ${bar} ]`].join('\n');

    const sect = new Section()
      .addComponents(new TextDisplay().setContent(text))
      .setAccessory(new Thumbnail().setMedia(avatar));

    const container = new Container().addComponents(
      sect,
      new Separator(),
      new TextDisplay().setContent(textBar),
    );

    await ctx.write({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  }
}
