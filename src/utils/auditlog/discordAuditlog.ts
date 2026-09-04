import { AuditLogEvent, UsingClient } from 'seyfert';

export async function findMessageDeleter(
  client: UsingClient,
  gId: string,
  aId: string,
  cId: string,
  Ms = 8_000,
): Promise<string | null> {
  try {
    const res = await client.proxy.guilds(gId)['audit-logs'].get({
      query: {
        action_type: AuditLogEvent.MessageDelete,
        limit: 5,
      },
    });

    const ents = res?.audit_log_entries ?? [];
    const now = Date.now();

    for (const ent of ents) {
      if (ent.target_id !== aId) continue;
      if (ent.options?.channel_id && ent.options.channel_id !== cId) continue;
      if (!ent.user_id) continue;

      const entTime = Number((BigInt(ent.id) >> 22n) + 1420070400000n);
      if (now - entTime > Ms) continue;

      return ent.user_id;
    }
  } catch (err) {
    console.error('Audit log err:', err);
  }

  return null;
}

// I WILL ADD MORE SOON
