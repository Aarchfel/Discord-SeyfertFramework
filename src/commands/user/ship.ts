import { Cooldown } from "@slipher/cooldown";
import { Command, type CommandContext, Container, createUserOption, Declare, MediaGallery, MessageFlags, Options, TextDisplay, Separator } from "seyfert";
import { calculateShip, getShipMedia } from "src/utils/ship";

const opt = {
  target1: createUserOption({
    description: 'User you want to ship',
    required: true
  }),
  target2: createUserOption({
    description: 'User you want to ship',
    required: true
  })
}

@Declare({
  name: 'ship',
  description: 'Ship user and see their matches >:3',
  integrationTypes: ['GuildInstall', 'UserInstall'],
})
@Options(opt)
@Cooldown.user(10_000)
export default class ShipCommand extends Command {
  async run(ctx: CommandContext<typeof opt>) {
    const user = ctx.author;
    const tg1 = ctx.options.target1;
    const tg2 = ctx.options.target2;

    if (tg1.id === tg2.id) {
      const iSelf = tg1.id === user.id;

      return ctx.write({
        content: iSelf
          ? 'ouuuu shiii, bro is too virgin that you used `/ship` to yourself? yo get someone else dawg'
          : 'you cannot ship this user with the same user dawg, i dont think they love themself✌️'
      });
    }
    
    const { percent } = calculateShip(tg1.id, tg2.id);

    const { medGal, attach } = getShipMedia(percent)

    const block = Math.floor(percent / 5);
    const bar = '🟩'.repeat(block) + '⬛'.repeat(20 - block);

    let comment = '';
    
    if (percent === 100) comment = 'OOMAAGAWDD YOU GUYS ARE PERRRFFECCTT >:33';
    else if (percent >= 80) comment = 'You guys matched! I would like to see you guys in the wedding! >:3c';
    else if (percent >= 50) comment = 'Oooo fair enoughh🤔, Maybe you guys loving each other';
    else if (percent >= 25) comment = 'Ouh.. are you guys loving enough?';
    else comment = 'ouh.... yk what? thats... eugh ;w;'

    const container = new Container().addComponents(
      new TextDisplay().setContent('# Ship Compatibility Test !'),
      new TextDisplay().setContent(`## [__${tg1.tag}__](https://discord.com/users/${tg1.id}/) x [__${tg2.tag}__](https://discord.com/users/${tg2.id}/)`),
      new TextDisplay().setContent(`## Percentage: **${percent}%**`),
      new TextDisplay().setContent(`${bar}`),
      new Separator(),
      new MediaGallery().addItems(medGal),
      new TextDisplay().setContent(`### ${comment}`)
    )

    await ctx.write({
      components: [container],
      files: [attach],
      flags: MessageFlags.IsComponentsV2
    })
  }
}
