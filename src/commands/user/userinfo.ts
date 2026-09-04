import { ButtonStyle, Command, Container, createUserOption, Declare, MessageFlags, Options, Section, TextDisplay, Thumbnail, Button, ActionRow, type CommandContext, Separator } from "seyfert";
import { Cooldown } from '@slipher/cooldown';

const opt = {
  target: createUserOption({
    description: 'The user to get the avatar of',
    required: false,
  })
};

@Declare({
  name: 'userinfo',
  description: 'Get information about a user',
  aliases: ['userinfo', 'user'],
  integrationTypes: ['GuildInstall', 'UserInstall'],
})
@Options(opt)
@Cooldown.user(10_000)
export default class UserInfoCommand extends Command {
  async run(ctx: CommandContext<typeof opt>) {
    const tg = ctx.options.target ?? ctx.member ?? ctx.author;

    const isMem = 'user' in tg;
    const user = isMem ? tg.user : tg;
    const mem = isMem ? tg : null;

    const jTimestamp = mem?.joinedAt ? Math.floor(new Date(mem.joinedAt).getTime() / 1000) : null;
    const cTimestamp = Math.floor(user.createdAt.getTime() / 1000);

    const avatarUrl = user.avatarURL({ size: 1024, extension: 'png' }) ?? user.defaultAvatarURL;

    let disc = user.discriminator;
    if (!disc || disc === '0') {
      disc = 'N/A'
    } else {
      disc = `#${disc}`;
    }

    const uDetail = [
      `# @${user.username}'s Information\n`,
      `## User Details`,
      `> Username: [__@${user.username}__](https://discord.com/users/${user.id}/)`,
      `> Display Name: __${user.tag}__`,
      `> ID: \`${user.id}\``,
      `> Number Tag: ${disc}`,
      `> Bot: ${user.bot ? 'Yes' : 'No'}`,
      `> Created At: <t:${cTimestamp}:F> (<t:${cTimestamp}:R>)`,
      `> Avatar: ${avatarUrl}\n`
    ].join('\n');

    let mDetail: string = '';

    if (mem && jTimestamp) {
      mDetail += `## Member Details\n`;
      mDetail += `> Joined At: <t:${jTimestamp}:F> (<t:${jTimestamp}:R>)\n`;

      const roleid = mem.roles?.keys;
      if (roleid && roleid.length > 0) {
        const role = roleid
          .filter((id: string) => id !== ctx.guildId)
          .map((r: string) => `<@&${r}>`);
        
        if (role.length > 0) {
          mDetail += `> Roles (${role.length}): ${role.join(', ')}`
        }
      }
    }

    const resp = `${uDetail}${mDetail}`;

    const btn = new ActionRow<Button>().addComponents(
      new Button()
        .setLabel('Copy ID')
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`copyid_${user.id}`)
    )

    const mainSection = new Section()
    .addComponents(
      new TextDisplay().setContent(resp)
    )
    .setAccessory(
      new Thumbnail().setMedia(avatarUrl)
    )

    const container = new Container().addComponents(
      mainSection,
      new Separator(),
      btn
    );

    await ctx.write({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
}
