import { Cooldown } from "@slipher/cooldown";
import petPetGif from "@someaspy/pet-pet-gif";
import { Command, type CommandContext, Container, createUserOption, Declare, MediaGallery, MediaGalleryItem, MessageFlags, Options, RawFile, TextDisplay, Separator } from "seyfert";

const opt = {
  target: createUserOption({
    description: 'User you want to pet',
    required: true
  })
}

@Declare({
  name: 'petpet',
  description: 'Pet users! Show us your love by petting them! >:3',
  integrationTypes: ['GuildInstall', 'UserInstall']
})
@Options(opt)
@Cooldown.user(10_000)
export default class PetCommand extends Command {
  async run(ctx: CommandContext<typeof opt>) {
    await ctx.deferReply();
    const tg = ctx.options.target;
    const author = ctx.author;
    const avatar = tg.avatarURL({size: 1024, extension: 'png'}) ?? tg.defaultAvatarURL;

    let resp: string = ''

    if (tg.id === author.id) {
      resp = `### Awww [${tg.tag}](https://discord.com/users/${tg.id}/) is petting themselves... :3c`
    } else {
      resp = `### Awwwww [${author.tag}](https://discord.com/users/${author.id}/) is petting [${tg.tag}](https://discord.com/users/${tg.id}/) how cute! :3`
    }

    const petpet = await petPetGif(avatar, {resolution: 256, delay: 20, backgroundColor: "transparent"});
    const attach: RawFile = {
      filename: 'petpet.gif',
      data: petpet
    }

    const media = new MediaGalleryItem().setMedia(`attachment://petpet.gif`);

    const container = new Container().addComponents(
      new TextDisplay().setContent(`# ${author.tag} is petting ${tg.tag}`),
      new TextDisplay().setContent(resp),
      new Separator(),
      new MediaGallery().addItems(media)
    )

    await ctx.editOrReply({
      components: [container],
      files: [attach],
      flags: MessageFlags.IsComponentsV2,
    })
  }
}
