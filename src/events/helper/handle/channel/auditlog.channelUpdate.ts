import {
  AllChannels,
  AuditLogEvent,
  ButtonStyle,
  Client,
  Formatter,
} from 'seyfert';
import { AuditEvents } from 'src/utils/auditlog/auditEvents';
import { dispatchAuditlog } from 'src/utils/auditlog/dispatch';
import { isFresh } from 'src/utils/auditlog/importantFunc';
import { AuditButtonDef, AuditChange } from 'src/utils/card/auditlogCard';
import { buildOverwriteChange } from 'src/utils/formatter/label';

const ovwActions = [
  AuditLogEvent.ChannelOverwriteCreate,
  AuditLogEvent.ChannelOverwriteUpdate,
  AuditLogEvent.ChannelOverwriteDelete,
];

export async function handleAuditLogChannelUpdate(
  channelN: AllChannels,
  channelO: AllChannels | any,
  client: Client<true>,
) {
  if (!('guildId' in channelN) || !channelN.guildId) return;

  const changes: AuditChange[] = [];

  const diffProp = <K extends string>(
    text: string,
    key: K,
    fmt: (v: any) => string = String,
  ) => {
    let valO = key in channelO ? (channelO as any)[key] : undefined;
    let valN = key in channelN ? (channelN as any)[key] : undefined;

    if (typeof valN === 'boolean') valO = valO ?? false;
    if (typeof valN === 'number') valO = valO ?? 0;

    const strO = valO !== undefined && valO !== null ? fmt(valO) : '`None`';
    const strN = valN !== undefined && valN !== null ? fmt(valN) : '`None`';

    if (strO === strN) return;
    changes.push({ type: 'edit', text, before: strO, after: strN });
  };

  if (channelO?.name !== channelN.name) {
    changes.push({
      type: 'edit',
      text: 'Name Changes',
      before: channelO.name,
      after: channelN.name,
    });
  }

  diffProp('Topic Changes', 'topic', (v) => (v ? v : '`None`'));
  diffProp('NSFW Changes', 'nsfw', (v) => (v ? 'Yes' : 'No'));
  diffProp('Slowmode Changes', 'rateLimitPerUser', (v) =>
    v ? `\`${v}s\`` : '`Off`',
  );
  diffProp('Bitrate Changes', 'bitrate', (v) => `\`${v / 1000}kbps\``);
  diffProp('User Limit Changes', 'userLimit', (v) =>
    v ? `\`${v} users\`` : '`No Limit`',
  );
  diffProp('Parent/Category Changes', 'parentId', (v) =>
    v ? `<#${v}>` : '`No Category`',
  );
  diffProp('Default Auto Archive', 'defaultAutoArchiveDuration', (v) =>
    v ? `\`${v} mins\`` : '`Default`',
  );
  diffProp('Voice Region', 'rtcRegion', (v) =>
    v ? `\`${v}\`` : '`Automatic`',
  );
  diffProp('Video Quality Mode', 'videoQualityMode', (v) =>
    v === 2 ? '`Full (720p/1080p)`' : '`Automatic`',
  );

  let execTag = '*(Unknown / System)*';
  let execId: string | null = null;
  let overwriteChanges: AuditChange[] = [];

  try {
    const auditLog = await client.proxy
      .guilds(channelN.guildId)
      ['audit-logs'].get({ query: { limit: 15 } });

    const entries = auditLog?.audit_log_entries ?? [];

    const updateEnt = entries.find(
      (e) =>
        e.target_id === channelN.id &&
        e.action_type === AuditLogEvent.ChannelUpdate,
    );
    if (updateEnt?.user_id) {
      execId = updateEnt.user_id;
      execTag = `${Formatter.userMention(updateEnt.user_id)} (\`${updateEnt.user_id}\`)`;
    }

    const ovwEntries = entries.filter(
      (e: any) =>
        e.target_id === channelN.id &&
        ovwActions.includes(e.action_type) &&
        isFresh(e.id),
    );

    for (const ent of ovwEntries) {
      const change = buildOverwriteChange(ent, channelN.guildId);
      if (change) overwriteChanges.push(change);

      if (execTag === '*(Unknown / System)*' && ent.user_id) {
        execTag = `${Formatter.userMention(ent.user_id)} (\`${ent.user_id}\`)`;
      }
    }
  } catch (e) {
    console.error('Failed to fetch audit log:', e);
  }

  if (overwriteChanges.length) changes.push(...overwriteChanges);

  if (!changes.length) return;

  const buttons: AuditButtonDef[] = [
    {
      label: 'Jump to Channel',
      style: ButtonStyle.Link,
      url: `https://discord.com/channels/${channelN.guildId}/${channelN.id}`,
    },
    {
      label: 'Copy ChannelID',
      style: ButtonStyle.Secondary,
      customId: `copyid_${channelN.id}`,
    },
  ];

  if (execId) {
    buttons.push({
      label: 'View Executor',
      style: ButtonStyle.Link,
      url: `https://discord.com/users/${execId}`,
    });
  }

  await dispatchAuditlog(client, channelN.guildId, AuditEvents.channelUpdate, {
    actorTag: execTag,
    targetTag: `${Formatter.channelMention(channelN.id)} - \`${channelN.name}\``,
    changes,
    buttons,
  });
}
