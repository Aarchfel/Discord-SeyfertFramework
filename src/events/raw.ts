import type { VoicePacket, VoiceServer, VoiceState, ChannelDeletePacket } from 'hoshimi';
import { createEvent } from 'seyfert';

type AnyPacket = VoicePacket | VoiceServer | VoiceState | ChannelDeletePacket;

export default createEvent({
  data: {name: 'raw'},
  run(pload, client) {
    if (pload.t === 'VOICE_STATE_UPDATE' && pload.d.user_id === client.me?.id) {
      client.logger.warn(`[Raw VoiceState] channel_id=${pload.d.channel_id} session=${pload.d.session_id}`)
    }
    if ((client as any).hoshimi){ 
      (client as any).hoshimi.updateVoiceState(pload as AnyPacket);
    }
  }
})