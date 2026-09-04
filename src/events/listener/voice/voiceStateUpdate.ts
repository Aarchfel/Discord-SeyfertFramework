import { createEvent } from 'seyfert';
import { handleAuditLogVoiceStateUpdate } from 'src/events/helper/handle/voice/auditlog.voiceStateUpdate';

export default createEvent({
  data: { name: 'voiceStateUpdate' },

  async run([newState, oldState], client) {
    const guildId = oldState?.guildId ?? newState.guildId;
    if (!guildId) return;

    await handleAuditLogVoiceStateUpdate(oldState, newState, client);
  },
});
