import { LoopMode } from "hoshimi";
import { ComponentCommand, MessageFlags, type ComponentContext } from "seyfert";
import { musicPlayingCard } from "src/utils/card/musicCard";

export default class MusicController extends ComponentCommand {
  componentType = "Button" as const;

  filter(ctx: ComponentContext) {
    return ctx.customId.startsWith("music_");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    if (!ctx.guildId || !ctx.member) return;

    const player = ctx.client.hoshimi.players.get(ctx.guildId);
    if (!player)
      return ctx.write({
        content: "No music is currently playing.",
        flags: MessageFlags.Ephemeral,
      });

    const vc = await ctx.member.voice().catch(() => null);
    if (!vc || vc.channelId !== player.voiceId) {
      return ctx.write({
        content:
          "You must be in the same voice channel as the bot to use this button.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const refresh = async () => {
      if (player.queue.current) {
        await ctx.update(musicPlayingCard(player, player.queue.current));
      } else {
        await ctx.deferUpdate();
      }
    };

    switch (ctx.customId) {
      case "music_pause": {
        const isPaused = !player.paused;
        await player.setPaused(isPaused);
        await refresh();
        break;
      }

      case "music_forward": {
        await player.seek(player.position + 10000);
        await ctx.deferUpdate();
        break;
      }

      case "music_rewind": {
        await player.seek(Math.max(0, player.position - 10000));
        await ctx.deferUpdate();
        break;
      }

      case "music_next": {
        await player.skip();
        await ctx.deferUpdate();
        break;
      }

      case "music_back": {
        const prev = await player.queue.previous(true);
        if (prev) {
          player.queue.unshift(prev);
          await player.skip();
        }
        await ctx.deferUpdate();
        break;
      }

      case "music_loop": {
        let nextMode: LoopMode;
        switch (player.loop) {
          case LoopMode.Off:
            nextMode = LoopMode.Queue;
            break;
          case LoopMode.Queue:
            nextMode = LoopMode.Track;
            break;
          default:
            nextMode = LoopMode.Off;
        }
        await player.setLoop(nextMode);
        await refresh();
        break;
      }

      case "music_copyurl": {
        await ctx.write({
          content: `${player.queue.current?.info.uri || "Unknown"}`,
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case "music_volup": {
        const newVolume = Math.min(100, Math.max(0, player.volume + 10));
        await player.setVolume(newVolume);
        await refresh();
        break;
      }

      case "music_voldown": {
        const newVolume2 = Math.min(100, Math.max(0, player.volume - 10));
        await player.setVolume(newVolume2);
        await refresh();
        break;
      }

      case "music_stop": {
        await ctx.deferUpdate();
        await player.destroy().catch(() => null);

        const ch = await ctx.client.channels
          .fetch(ctx.interaction.message.channelId)
          .catch(() => null);

        if (ch && ch.isTextable()) {
          await ch.messages
            .delete(ctx.interaction.message.id)
            .catch(() => null);
        }
        break;
      }

      default: {
        return ctx.write({
          content: "Unknown action.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  }
}
