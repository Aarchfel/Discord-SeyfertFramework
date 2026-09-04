import { UsingClient } from 'seyfert';
import { AuditEventDefs } from './registry';
import {
  AuditCardInp,
  auditlogCard,
  buildAuditMessage,
} from '../card/auditlogCard';
import { AuditlogService } from '../database/auditlogService';
import {
  executeAuditWebhook,
  forgetAuditWebhook,
  getAuditWebhook,
  WebhookGoneError,
} from './webhook';

export async function dispatchAuditlog(
  client: UsingClient,
  gId: string,
  event: AuditEventDefs,
  cInput: Omit<AuditCardInp, 'event'>,
): Promise<void> {
  if (!AuditlogService.isEnabled(gId)) return;

  const state = AuditlogService.getEventState(gId, event.key);
  if (!state.enabled) return;

  const cId = AuditlogService.resolveChannel(gId, event.category);
  if (!cId) return;

  const card = auditlogCard({ event, ...cInput });
  const payload = buildAuditMessage(card, state.pingRoleId);

  try {
    const webhook = await getAuditWebhook(gId, cId);
    await executeAuditWebhook(webhook.id, webhook.token, payload);
  } catch (err) {
    if (err instanceof WebhookGoneError) {
      forgetAuditWebhook(cId);
      try {
        const webhook = await getAuditWebhook(gId, cId);
        await executeAuditWebhook(webhook.id, webhook.token, payload);
        return;
      } catch (retErr) {
        client.logger.warn(
          `[AUDITLOG] Filed to retry log ${event.key} on guild ${gId}:`,
          retErr,
        );
        return;
      }
    }

    client.logger.warn(
      `[AUDITLOG] Failed to sent log ${event.key} on guild ${gId}:`,
      err,
    );
  }
}
