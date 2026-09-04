import {
  existsSync,
  readdirSync,
  unlinkSync,
  mkdirSync,
} from "fs";
import { join, relative } from "path";
import sharp from "sharp";
import type { ComponentContext, Message } from "seyfert";
import { setCustomizeConfig } from "./database/guildConfig";

const allow = ["png", "jpeg", "jpg", "webp", "gif"];
const maxfilesize = 8 * 1024 * 1024;
const guildDir = join(process.cwd(), "data", "images", "guilds");

export const defaultTemp = join(
  process.cwd(),
  "assets",
  "images",
  "welcomeleave",
  "boykisserhai.jpeg",
);
const timeout = 60 * 1000;

export type ImgKind = "welcome" | "leave";

function clearOldImg(gDir: string, kind: ImgKind) {
  if (!existsSync(gDir)) return;
  for (const f of readdirSync(gDir)) {
    if (f.startsWith(`${kind}.`)) unlinkSync(join(gDir, f));
  }
}

export async function collGuildImg(
  ctx: ComponentContext,
  kind: ImgKind,
): Promise<{ success: boolean; reason?: string }> {
  const gid = ctx.guildId!;
  const uid = ctx.author.id;
  const chid = ctx.channelId;

  return new Promise((res) => {
    ctx.client.collectors.create({
      event: "messageCreate",
      timeout: timeout,
      filter: (msg: Message) =>
        msg.author.id === uid &&
        msg.channelId === chid &&
        [...msg.attachments.values()].some((attach) =>
          allow.some((e) => attach.filename?.toLowerCase().endsWith(`.${e}`)),
        ),
      run: async (msg: Message, stop: (reason: string) => void) => {
        const attach = [...msg.attachments.values()].find((att) =>
          allow.some((e) => att.filename?.toLowerCase().endsWith(`.${e}`)),
        )!;

        if (attach.size > maxfilesize) {
          stop("size_limit");
          res({ success: false, reason: "File size is too large. MAX: 8MB" });
        }

        try {
          const result = await fetch(attach.url);
          const buff = Buffer.from(await result.arrayBuffer());

          const img = sharp(buff, {animated: true});
          const metadata = await img.metadata();

          const format = metadata.format;
          if (!format || !allow.includes(format === "jpeg" ? "jpg" : format)) {
            stop("invalid_content");
            await msg.delete().catch(() => null);
            return res({ success: false, reason: "Invalid image format" });
          }

          const gdir = join(guildDir, gid);
          if (!existsSync(gdir)) mkdirSync(gdir, { recursive: true });

          clearOldImg(gdir, kind);

          const finalext = format === "jpeg" ? "jpg" : format;
          const absopath = join(gdir, `${kind}.${finalext}`);
          await img.toFile(absopath);

          const path = relative(process.cwd(), absopath);
          
          await img.toFile(path);

          setCustomizeConfig(gid, { [`${kind}_image`]: path } as any);

          await msg.delete().catch(() => null);
          stop("done");
          res({ success: true });
        } catch (err) {
          ctx.client.logger.error("[Img Upload Err]:", err);
          stop("err");
          res({ success: false, reason: "Failed to upload image or invalid image format" });
        }
      },
      onStop: async (reason: string) => {
        if (reason === "timeout") {
          res({
            success: false,
            reason: "Timed out waiting for an image (60s)",
          });
        }
      },
    });
  });
}

export async function resetGuildImg(
  gid: string,
  kind: ImgKind
): Promise<{success: boolean; reason?: string}> {
  try {
    const gdir = join(guildDir, gid);
    clearOldImg(gdir, kind);

    setCustomizeConfig(gid, { [`${kind}_image`]: null } as any);

    return { success: true };
  } catch (err) {
    console.error("[Img Reset Err]:", err);
    return { success: false, reason: "Failed to reset image" };
  }
}
