import {
  Player,
  Track,
  TrackEndEvent,
  TrackExceptionEvent,
  TrackStuckEvent,
} from "hoshimi";
import { LRUCache } from "lru-cache";
import { UsingClient } from "seyfert";
import { musicPlayingCard } from "src/utils/card/musicCard";

const active = new LRUCache<string, string>({ max: 100, ttl: 1000 * 60 * 60 });

export async function refreshPlayingCard(client: UsingClient, player: Player) {
  if (!player.textId || !player.queue.current) return;

  const oMsgid = active.get(player.guildId);
  if (!oMsgid) return;

  const ch = await client.channels.fetch(player.textId).catch(() => null);
  if (!ch || !ch.isTextable()) return;

  await ch.messages
    .edit(oMsgid, musicPlayingCard(player, player.queue.current))
    .catch(() => null);
}

export function registerHoshimiPlayer(client: UsingClient) {
  client.hoshimi.on("trackStart", async (player: Player, track: Track) => {
    if (!player.textId) return;

    const ch = await client.channels.fetch(player.textId).catch(() => null);
    if (!ch || !ch.isTextable()) return;

    const oMsgId = active.get(player.guildId);
    if (oMsgId) {
      await ch.messages.delete(oMsgId).catch(() => null);
    }

    const msg = await ch.messages
      .write(musicPlayingCard(player, track))
      .catch(() => null);

    if (msg) {
      active.set(player.guildId, msg.id);
    }
  });

  client.hoshimi.on("queueEnd", async (player: Player) => {
    if (!player.textId) return;

    const oMsgId = active.get(player.guildId);
    if (oMsgId) {
      const ch = await client.channels.fetch(player.textId).catch(() => null);
      if (ch && ch.isTextable()) {
        await ch.messages.delete(oMsgId).catch(() => null);
      }
    }
    active.delete(player.guildId);

    await player.destroy().catch(() => null);
  });

  client.hoshimi.on(
    "trackStuck",
    (player: Player, track: Track, payload: TrackStuckEvent) => {
      client.logger.warn(
        `[Track Stuck] guild=${player.guildId} track=${track?.info.title} thresholdMs=${payload.thresholdMs}`,
      );
    },
  );

  client.hoshimi.on(
    "trackError",
    (player: Player, track: Track, payload: TrackExceptionEvent) => {
      client.logger.error(
        `[Track Error] guild=${player.guildId} track=${track?.info.title}`,
        payload.exception,
      );
    },
  );

  client.hoshimi.on(
    "trackEnd",
    (player: Player, track: Track, payload: TrackEndEvent) => {
      client.logger.info(
        `[Track End] guild=${player.guildId} track=${track?.info.title} reason=${payload.reason}`,
      );
    },
  );
}
