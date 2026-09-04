import {
  Command,
  type CommandContext,
  createStringOption,
  Declare,
  MessageFlags,
  Options,
} from "seyfert";
import { Cooldown } from "@slipher/cooldown";
import { LoadType } from "hoshimi";
import { refreshPlayingCard } from "src/events/music/trackStart";

const opt = {
  query: createStringOption({
    description: "The link or search query to play music",
    required: true,
  }),
};

@Declare({
  name: "music",
  description:
    "Play music in your voice channel by using a link or search query",
  integrationTypes: ["GuildInstall"],
})
@Options(opt)
@Cooldown.user(5_000)
export default class MusicCommand extends Command {
  async run(ctx: CommandContext<typeof opt>) {
    const optquery = ctx.options.query;
    if (!ctx.guild || !ctx.member) {
      await ctx.write({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const vc = await ctx.member.voice().catch(() => null);
    if (!vc || !vc.channelId) {
      await ctx.write({
        content: "You must be in a voice channel to use this command.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const me = await ctx.me();
    const botVc = await me?.voice().catch(() => null);
    if (botVc && botVc.channelId !== vc.channelId) {
      await ctx.write({
        content:
          "ummm.. im already in a different voice channel.\nPlease join that channel to use this command",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await ctx.deferReply();

    try {
      const player = ctx.client.hoshimi.createPlayer({
        guildId: ctx.guildId as string,
        voiceId: vc.channelId,
        textId: ctx.channelId,
        volume: 50,
      });

      await player
        .connect({
          guildId: ctx.guildId as string,
          voiceId: vc.channelId,
          selfDeaf: false,
          selfMute: false,
        })
        .catch((err: any) =>
          ctx.client.logger.error("[Voice Conn. Err]:", err),
        );

      const res = await player.search({
        query: optquery,
        requester: {
          id: ctx.author.id,
          username: ctx.author.username,
        },
      });

      if (
        res.loadType === LoadType.Empty ||
        res.loadType === LoadType.Error ||
        !res.tracks.length
      ) {
        await ctx.editOrReply({
          content: `No results found for your query.\nQuery: \`${optquery}\`\n> Please try again with a different query.`,
        });
        return;
      }

      const wasPlay = player.playing;

      if (res.loadType === LoadType.Playlist && res.playlist) {
        await player.queue.add(res.tracks);
        await ctx.editOrReply({
          content: `Added **${res.tracks.length}** tracks from the playlist \`${res.playlist?.info.name}\` to the queue.`,
        });
      } else {
        const track = res.tracks[0];
        await player.queue.add(track);

        await ctx.editOrReply({
          content: player.playing
            ? `Added **${track.info.title}** to the queue.\n> Queue: \`${player.queue.tracks.length}\``
            : `Playing **${track.info.title}**`,
        });
      }

      if (!player.playing && !player.paused) {
        await player.play();
      } else if (wasPlay) {
        await refreshPlayingCard(ctx.client, player);
      }
    } catch (err) {
      ctx.client.logger.error(`[Music Play Err]:`, err);
      const errmsg = err instanceof Error ? err.message : String(err);
      await ctx
        .editOrReply({
          content: `An error occurred while trying to play music.\nErr: \`${errmsg}\``,
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => null);
    }
  }
}
