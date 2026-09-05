import { Guild, MessageFlags, UsingClient } from 'seyfert';
import { resolvePlaceholder } from 'src/utils/formatter/placeholder';
import { getRawFile } from 'src/utils/files/getRawFile';
import { buildV2Container } from 'src/utils/formatter/compoParser';
import { defaultTemp } from 'src/utils/imgUpload';
import { buildGCIContext } from './welcome.memberAdd';

export async function sendLeaveCard(
  mem: any,
  client: UsingClient,
  guild: Guild,
  ctx: Awaited<ReturnType<typeof buildGCIContext>>,
) {
  const { gcfg, ccfg, used } = ctx;
  if (!gcfg.leave_channel) return;

  const text = await resolvePlaceholder(
    ccfg.leave_message ?? 'Goodbye {mention} from {server}',
    {
      client,
      member: mem,
      user: mem.user ?? mem,
      guild,
      inviter: used?.inviter ?? null,
      inviteCode: used?.code ?? null,
      inviteUses: used?.uses ?? null,
    },
  );

  const { attach, fileName } = getRawFile(
    ccfg.leave_image,
    defaultTemp,
    'leave',
  );
  const container = buildV2Container(text, { fileName: fileName ?? undefined });

  const ch = await client.channels.fetch(gcfg.leave_channel).catch(() => null);
  if (ch?.isTextable()) {
    await ch.messages.write({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      files: attach,
    });
  }
}
