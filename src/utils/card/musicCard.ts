import { LoopMode, type Track, type Player } from "hoshimi";
import {
  Button,
  ButtonStyle,
  ActionRow,
  Container,
  MediaGallery,
  Thumbnail,
  TextDisplay,
  MessageFlags,
} from "seyfert";

export function formatDur(ms: number) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec < 10 ? "0" : ""}${sec}`;
}

export function musicPlayingCard(player: Player, track: Track) {
  const artwork = track?.info.artworkUrl as string;
  const hasNext = player.queue.tracks.length > 0;
  const hasPrev = player.queue.history.length > 0;

  const currpos = player.queue.history.length + 1;
  const total = player.queue.history.length + 1 + player.queue.tracks.length;

  const text = [
    `## Duration: \`${track?.info.isStream ? "Live Stream" : formatDur(track?.info.length || 0)}\``,
    ` Volume: ${player.volume}%`,
    ` Loop: \`${player.loop === LoopMode.Off ? "Disabled" : player.loop === LoopMode.Queue ? "Queue" : "Track"}\``,
    ` Queue: ${currpos}/${total}`,
    ` Requested by: ${track?.requester.username ? `<@${track.requester.id}>` : "Unknown"}`,
  ].join("\n");

  const row1btn: Button[] = [];

  if (hasPrev) {
    row1btn.push(
      new Button()
        .setLabel("Back")
        .setStyle(ButtonStyle.Success)
        .setCustomId("music_back")
        .setEmoji("⏮️"),
    );
  }

  row1btn.push(
    new Button()
      .setLabel("-10s")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId("music_rewind")
      .setEmoji("⏪"),
    new Button()
      .setLabel(player.paused ? "Resume" : "Pause")
      .setStyle(player.paused ? ButtonStyle.Success : ButtonStyle.Primary)
      .setCustomId("music_pause")
      .setEmoji(player.paused ? "▶️" : "⏸️"),
    new Button()
      .setLabel("+10s")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId("music_forward")
      .setEmoji("⏩"),
  );

  if (hasNext) {
    row1btn.push(
      new Button()
        .setLabel("Next")
        .setStyle(ButtonStyle.Success)
        .setCustomId("music_next")
        .setEmoji("⏭️"),
    );
  }

  const row1 = new ActionRow<Button>().addComponents(...row1btn);

  const row2 = new ActionRow<Button>().addComponents(
    new Button()
      .setLabel("Copy URL")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId("music_copyurl")
      .setEmoji("🔗"),
    new Button()
      .setLabel("Vol 10+")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId("music_volup")
      .setEmoji("🔊"),
    new Button()
      .setLabel("Vol 10-")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId("music_voldown")
      .setEmoji("🔊"),
    new Button()
      .setLabel("Loop")
      .setStyle(
        player.loop === LoopMode.Off
          ? ButtonStyle.Secondary
          : ButtonStyle.Success,
      )
      .setCustomId("music_loop")
      .setEmoji("🔁"),
    new Button()
      .setLabel("Stop")
      .setStyle(ButtonStyle.Danger)
      .setCustomId("music_stop")
      .setEmoji("⏹️"),
  );

  const container = new Container().addComponents(
    new TextDisplay().setContent(
      `# Now Playing [${track?.info.title}](${track?.info.uri})\n## Uploaded by: \`${track?.info.author}\``,
    ),
    new MediaGallery().addItems(new Thumbnail().setMedia(artwork)),
    new TextDisplay().setContent(text),
    row1,
    row2,
  );

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  };
}
