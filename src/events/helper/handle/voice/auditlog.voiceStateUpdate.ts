import { AuditLogEvent, Formatter, UsingClient, VoiceState } from 'seyfert';
import { AuditEvents } from 'src/utils/auditlog/auditEvents';
import { dispatchAuditlog } from 'src/utils/auditlog/dispatch';
import { isFresh } from 'src/utils/auditlog/importantFunc';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const auditDelay = 800;

interface VoiceModEvent {
  eventType: (typeof AuditEvents)[keyof typeof AuditEvents];
  fields: Array<{ label: string; value: string }>;
  changeKey?: 'mute' | 'deaf';
}

export async function handleAuditLogVoiceStateUpdate(
  oldState: VoiceState | undefined,
  newState: VoiceState | undefined,
  client: UsingClient,
) {
  if (!newState) return;
  const guildId = newState.guildId ?? oldState?.guildId;
  const userId = newState.userId ?? oldState?.userId;
  if (!guildId || !userId) return;

  const tgTag = `${Formatter.userMention(userId)} (\`${userId}\`)`;
  const beforeCh = oldState?.channelId;
  const afterCh = newState.channelId;

  if (!beforeCh && afterCh) {
    await dispatchAuditlog(client, guildId, AuditEvents.voiceJoin, {
      targetTag: tgTag,
      actorTag: '*(System / Self)*',
      fields: [{ label: 'Channel', value: Formatter.channelMention(afterCh) }],
    });
    return;
  }

  if (beforeCh && !afterCh) {
    let actorTag = '*(System / Self)*';

    try {
      await sleep(auditDelay);
      const audit = await client.proxy.guilds(guildId)['audit-logs'].get({
        query: { limit: '10', action_type: AuditLogEvent.MemberDisconnect },
      });

      const ent = audit?.audit_log_entries?.find(
        (e: any) => e.target_id === userId && isFresh(e.id),
      );

      if (ent?.user_id && ent.user_id !== userId) {
        actorTag = `${Formatter.userMention(ent.user_id)} (\`${ent.user_id}\`)`;
      }
    } catch (e) {
      console.error(
        '[VoiceState Audit] Failed to fetch disconnect audit log:',
        e,
      );
    }

    await dispatchAuditlog(client, guildId, AuditEvents.voiceLeave, {
      targetTag: tgTag,
      actorTag,
      fields: [
        { label: 'From Channel', value: Formatter.channelMention(beforeCh) },
      ],
    });
    return;
  }

  if (beforeCh && afterCh && beforeCh !== afterCh) {
    await dispatchAuditlog(client, guildId, AuditEvents.voiceMove, {
      targetTag: tgTag,
      actorTag: '*(System / Self)*',
      changes: [
        {
          type: 'edit',
          text: 'Voice Channel',
          before: Formatter.channelMention(beforeCh),
          after: Formatter.channelMention(afterCh),
        },
      ],
    });
    return;
  }

  if (beforeCh && afterCh && beforeCh === afterCh) {
    const events: VoiceModEvent[] = [];

    if (oldState?.mute !== newState.mute) {
      events.push({
        eventType: AuditEvents.voiceMute,
        changeKey: 'mute',
        fields: [
          {
            label: 'Status',
            value: newState?.mute
              ? '`[ 🔇 ]` *Server Muted*'
              : '`[ 🔊 ]` *Server Unmuted*',
          },
          { label: 'Channel', value: Formatter.channelMention(afterCh) },
        ],
      });
    }

    if (oldState?.deaf !== newState.deaf) {
      events.push({
        eventType: AuditEvents.voiceDeafen,
        changeKey: 'deaf',
        fields: [
          {
            label: 'Status',
            value: newState?.deaf
              ? '`[ 🎧x ]` *Server Deafened*'
              : '`[ 🎧 ]` *Server Undeafened*',
          },
          { label: 'Channel', value: Formatter.channelMention(afterCh) },
        ],
      });
    }

    if (oldState?.selfStream !== newState.selfStream) {
      events.push({
        eventType: AuditEvents.voiceStream,
        fields: [
          {
            label: 'Status',
            value: newState?.selfStream
              ? '`[ 🖥️ ]` *Self Stream Enabled*'
              : '`[ 🖥️x ]` *Self Stream Disabled*',
          },
          { label: 'Channel', value: Formatter.channelMention(afterCh) },
        ],
      });
    }

    if (oldState?.selfVideo !== newState.selfVideo) {
      events.push({
        eventType: AuditEvents.voiceCamera,
        fields: [
          {
            label: 'Status',
            value: newState?.selfVideo
              ? '`[ 📹 ]` *Camera Enabled*'
              : '`[ 📹x ]` *Camera Disabled*',
          },
          { label: 'Channel', value: Formatter.channelMention(afterCh) },
        ],
      });
    }

    if (!events.length) return;

    const needsAudit = events.some((e) => e.changeKey);
    let auditEntries: any[] = [];

    if (needsAudit) {
      try {
        await sleep(auditDelay);
        const audit = await client.proxy.guilds(guildId)['audit-logs'].get({
          query: { limit: '10', action_type: AuditLogEvent.MemberUpdate },
        });
        auditEntries = audit?.audit_log_entries ?? [];
      } catch (e) {
        console.error(
          '[VoiceState Audit] Failed to fetch mute/deaf audit log:',
          e,
        );
      }
    }

    for (const ev of events) {
      let actorTag = '*(System / Self)*';

      if (ev.changeKey) {
        const ent = auditEntries.find(
          (e: any) =>
            e.target_id === userId &&
            isFresh(e.id) &&
            e.changes?.some((c: any) => c.key === ev.changeKey),
        );

        if (ent?.user_id) {
          actorTag = `${Formatter.userMention(ent.user_id)} (\`${ent.user_id}\`)`;
        }
      }

      await dispatchAuditlog(client, guildId, ev.eventType, {
        targetTag: tgTag,
        actorTag,
        fields: ev.fields,
      });
    }
  }
}
