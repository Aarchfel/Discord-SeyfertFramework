import { AttachmentBuilder } from "seyfert";

// MAX 25MB FILES
const maxAttach = 25 * 1024 * 1024;

export interface ResolvedAnonAttachment {
  filename: string;
  buffer: Buffer<ArrayBufferLike>;
  isImage: boolean;
}

export interface AnonAttachment {
  filename: string;
  url: string;
  size: number;
  contentType?: string | null;
}

export async function resolveAnonAttach(attach: AnonAttachment[]): Promise<ResolvedAnonAttachment[]> {
  if (!attach.length) return [];

  const result = await Promise.all(
    attach.map(async (att) => {
      if (att.size > maxAttach) return null;

      try {
        const res = await fetch(att.url);
        if (!res.ok) return null;
        const buff = Buffer.from(await res.arrayBuffer());

        const item: ResolvedAnonAttachment = {
          filename: att.filename,
          buffer: buff,
          isImage: (att.contentType ?? "").startsWith("image/"),
        };

        return item;

      } catch {
        return null;
      }
    }),
  );

  return result.filter((r): r is ResolvedAnonAttachment => r !== null);
}

export function toAttachBuilder(resolved: ResolvedAnonAttachment[]): AttachmentBuilder[] {
  return resolved.map((r) => new AttachmentBuilder().setName(r.filename).setFile("buffer", r.buffer));
}
