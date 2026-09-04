import {
  AuditLogEvent,
  ButtonStyle,
  Formatter,
  Guild,
  UsingClient,
} from 'seyfert';
import { AuditEvents } from 'src/utils/auditlog/auditEvents';
import { dispatchAuditlog } from 'src/utils/auditlog/dispatch';
import { AuditChange } from 'src/utils/card/auditlogCard';
import {
  mfaLevelLabel,
  verificationLevelLabel,
} from 'src/utils/formatter/label';

export async function handleAuditLogGuildUpdate(
  guildN: Guild<any>,
  guildO: Guild<any>,
  client: UsingClient,
) {
  const changes: AuditChange[] = [];

  const diffText = (
    text: string,
    before: unknown,
    after: unknown,
    fmt: (v: any) => string = String,
  ) => {
    if (before === after) return;
    changes.push({
      type: 'edit',
      text: text,
      before: fmt(before),
      after: fmt(after),
    });
  };

  const diffCh = (
    text: string,
    before?: string | null,
    after?: string | null,
  ) => {
    diffText(text, before, after, (v) => (v ? `<#${v}>` : '`None`'));
  };

  diffText('Name Server', guildO.name, guildN.name);

  if (guildO.icon !== guildN.icon) {
    changes.push({
      type: 'image',
      text: 'Icon Server Changed',
      beforeUrl: guildO.iconURL() ?? null,
      afterUrl: guildN.iconURL() ?? null,
    });
  }

  if (guildO.banner !== guildN.banner) {
    changes.push({
      type: 'image',
      text: 'Banner Server Changed',
      beforeUrl: guildO.bannerURL() ?? null,
      afterUrl: guildN.bannerURL() ?? null,
    });
  }

  diffText(
    'Verification Level',
    guildO.verificationLevel,
    guildN.verificationLevel,
    (v) => `\`${verificationLevelLabel[v] ?? v}\``,
  );

  diffCh('AFK Channel', guildO.afkChannelId, guildN.afkChannelId);

  diffText(
    'MFA Requirement (2FA for mods)',
    guildO.mfaLevel,
    guildN.mfaLevel,
    (v) => `\`${mfaLevelLabel[v] ?? v}\``,
  );

  diffCh('System Channel', guildO.systemChannelId, guildN.systemChannelId);

  diffCh('Rules CHannel', guildO.rulesChannelId, guildN.rulesChannelId);

  diffCh(
    'Public Updates Channel',
    guildO.publicUpdatesChannelId,
    guildN.publicUpdatesChannelId,
  );

  diffText(
    'Boost Tier',
    guildO.premiumTier,
    guildN.premiumTier,
    (v) => `\`Tier ${v}\``,
  );

  diffText(
    'Boost Count',
    guildO.premiumSubscriptionCount,
    guildN.premiumSubscriptionCount,
  );

  diffText(
    'Vanity URL',
    guildO.vanityUrlCode,
    guildN.vanityUrlCode,
    (v) => `\`discord.gg/${v}\``,
  );

  if (guildO.ownerId !== guildN.ownerId) {
    changes.push({
      type: 'edit',
      text: '⚠️ SERVER OWNERSHIP TRANSFERRED',
      before: `${Formatter.userMention(guildO.ownerId)} (\`${guildO.ownerId}\`)`,
      after: `${Formatter.userMention(guildN.ownerId)} (\`${guildN.ownerId}\`)`,
    });
  }

  if (!changes.length) return;

  let execTag = '*Unknown User*';
  try {
    const auditLog = await client.proxy
      .guilds(guildN.id)
      ['audit-logs'].get({
        query: {
          limit: '1',
          action_type: AuditLogEvent.GuildUpdate,
        },
      })
      .catch(() => null);

    const ent = auditLog?.audit_log_entries?.[0];

    if (ent && ent.user_id) {
      execTag = `${Formatter.userMention(ent.user_id)} (\`${ent.user_id}\`)`;
    }
  } catch (e) {
    console.error('Failed to fetch audit log:', e);
  }

  await dispatchAuditlog(client, guildN.id, AuditEvents.guildUpdate, {
    targetTag: guildN.name,
    actorTag: execTag,
    fields: [
      {
        label: 'Server ID',
        value: `\`${guildN.id}\``,
      },
    ],
    changes,
    buttons: [
      {
        label: 'View Server',
        style: ButtonStyle.Link,
        url: `https://discord.com/channels/${guildN.id}`,
      },
      {
        label: 'Copy ServerID',
        style: ButtonStyle.Secondary,
        customId: `copyid_${guildN.id}`,
      },
    ],
  });
}
