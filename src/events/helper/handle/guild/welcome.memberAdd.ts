import type { Guild, GuildMember, UsingClient } from 'seyfert';
import { MessageFlags } from 'seyfert';
import {
  getCustomizeConfig,
  getGuildConfig,
} from 'src/utils/database/guildConfig';
import { getRawFile } from 'src/utils/files/getRawFile';
import { buildV2Container } from 'src/utils/formatter/compoParser';
import { resolvePlaceholder } from 'src/utils/formatter/placeholder';
import { defaultTemp } from 'src/utils/imgUpload';
import { resolveUsedInvite } from 'src/utils/invites/inviteTracker';

export async function buildGCIContext(
  // mem: GuildMember,
  client: UsingClient,
  guild: Guild,
) {
  const gcfg = getGuildConfig(guild.id);
  const ccfg = getCustomizeConfig(guild.id);
  const used = await resolveUsedInvite(client, guild.id);
  return { gcfg, ccfg, used };
}

export async function sendWelcomeCard(
  mem: GuildMember,
  client: UsingClient,
  guild: Guild,
  ctx: Awaited<ReturnType<typeof buildGCIContext>>,
) {
  const { gcfg, ccfg, used } = ctx;
  if (!gcfg.welcome_channel) return;

  const text = await resolvePlaceholder(
    ccfg.welcome_message ?? 'Welcome {mention} to {server}',
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
    ccfg.welcome_image,
    defaultTemp,
    'welcome',
  );
  const container = buildV2Container(text, { fileName: fileName ?? undefined });

  const ch = await client.channels
    .fetch(gcfg.welcome_channel)
    .catch(() => null);
  if (ch?.isTextable()) {
    await ch.messages.write({
      files: attach,
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  }
}

export async function sendGreetDM(
  client: UsingClient,
  mem: GuildMember,
  // client: UsingClient,
  guild: Guild,
  ctx: Awaited<ReturnType<typeof buildGCIContext>>,
) {
  const { ccfg, used } = ctx;

  const text = await resolvePlaceholder(
    ccfg.greet_message ?? 'Welcome {mention} to {server}',
    {
      client,
      member: mem,
      user: mem.user ?? mem,
      guild: guild,
      inviter: used?.inviter ?? null,
      inviteCode: used?.code ?? null,
      inviteUses: used?.uses ?? null,
    },
  );

  const ico = guild.iconURL({ size: 512 }) ?? undefined;
  const container = buildV2Container(text, { guildIcon: ico });

  const sent = await mem.user
    .write({ components: [container], flags: MessageFlags.IsComponentsV2 })
    .catch((err: any) => {
      console.error(`[DM] Failed to send DM to ${mem.id}:`, err);
      return null;
    });

  if (sent) console.log(`[DM] Sent DM to ${mem.id}`);
  return sent;
}
