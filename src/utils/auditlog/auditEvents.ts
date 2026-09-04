import { AuditEventDefs } from './registry';

export const AuditEvents = {
  // msg_log ===============================================
  messageDelete: {
    key: 'messageDelete',
    label: 'Message Deleted',
    category: 'msg_log',
    emoji: '📰',
    description: 'Triggered when a message was deleted',
    implemented: true,
  },

  messageUpdate: {
    key: 'messageUpdate',
    label: 'Message Updated',
    category: 'msg_log',
    emoji: '📝',
    description: 'Triggered when a message was updated',
    implemented: true,
  },

  messageDeleteBulk: {
    key: 'messageDeleteBulk',
    label: 'Bulk Message Deleted',
    category: 'msg_log',
    emoji: '📤',
    description: 'Triggered when bulk messages were deleted',
    implemented: true,
  },

  // member_log ===============================================
  guildMemberAdd: {
    key: 'guildMemberAdd',
    label: 'Member Joined',
    category: 'member_log',
    emoji: '👤',
    description: 'Triggered when a member joined',
    implemented: true,
  },

  guildMemberRemove: {
    key: 'guildMemberRemove',
    label: 'Member Left',
    category: 'member_log',
    emoji: '🚪',
    description: 'Triggered when a member left',
    implemented: true,
  },

  guildMemberUpdate: {
    key: 'guildMemberUpdate',
    label: 'Member Updated',
    category: 'member_log',
    emoji: '🔄',
    description: 'Triggered when a member was updated',
    implemented: false,
  },

  guildMemberTimeout: {
    key: 'guildMemberTimeout',
    label: 'Member Timed Out',
    category: 'member_log',
    emoji: '⏳',
    description: 'Triggered when a member was timed out',
    implemented: false,
  },

  // mod_log ===============================================
  guildBanAdd: {
    key: 'guildBanAdd',
    label: 'Member Banned',
    category: 'mod_log',
    emoji: '🚫',
    description: 'Triggered when a member was banned',
    implemented: true,
  },

  guildBanRemove: {
    key: 'guildBanRemove',
    label: 'Member Unbanned',
    category: 'mod_log',
    emoji: '🕊️',
    description: 'Triggered when a member was unbanned',
    implemented: true,
  },

  // channel_role_log ===============================================
  channelCreate: {
    key: 'channelCreate',
    label: 'Channel Created',
    category: 'channel_role_log',
    emoji: '➕',
    description: 'Triggered when a channel was created',
    implemented: true,
  },

  channelDelete: {
    key: 'channelDelete',
    label: 'Channel Deleted',
    category: 'channel_role_log',
    emoji: '➖',
    description: 'Triggered when a channel was deleted',
    implemented: true,
  },

  channelUpdate: {
    key: 'channelUpdate',
    label: 'Channel Updated',
    category: 'channel_role_log',
    emoji: '🔁',
    description: 'Triggered when a channel was updated',
    implemented: true,
  },

  roleCreate: {
    key: 'roleCreate',
    label: 'Role Created',
    category: 'channel_role_log',
    emoji: '➕',
    description: 'Triggered when a role was created',
    implemented: true,
  },

  roleDelete: {
    key: 'roleDelete',
    label: 'Role Deleted',
    category: 'channel_role_log',
    emoji: '➖',
    description: 'Triggered when a role was deleted',
    implemented: true,
  },

  roleUpdate: {
    key: 'roleUpdate',
    label: 'Role Updated',
    category: 'channel_role_log',
    emoji: '🔁',
    description: 'Triggered when a role was updated',
    implemented: true,
  },

  // voice_log ===============================================
  voiceJoin: {
    key: 'voiceJoin',
    label: 'Member Joined Voice Channel',
    category: 'voice_log',
    emoji: '🎙️',
    description: 'Triggered when a member joined a voice channel',
    implemented: true,
  },

  voiceLeave: {
    key: 'voiceLeave',
    label: 'Member Left Voice Channel',
    category: 'voice_log',
    emoji: '🚪',
    description: 'Triggered when a member left a voice channel',
    implemented: true,
  },

  voiceMove: {
    key: 'voiceMove',
    label: 'Member Moved Voice Channel',
    category: 'voice_log',
    emoji: '🔀',
    description: 'Triggered when a member moved to a voice channel',
    implemented: true,
  },

  voiceMute: {
    key: 'voiceMute',
    label: 'Member Muted',
    category: 'voice_log',
    emoji: '🔇',
    description: 'Triggered when a member was muted',
    implemented: true,
  },

  voiceDeafen: {
    key: 'voiceDeafen',
    label: 'Member Deafened',
    category: 'voice_log',
    emoji: '🔈',
    description: 'Triggered when a member was deafened',
    implemented: true,
  },

  voiceStream: {
    key: 'voiceStream',
    label: 'Member Started Streaming',
    category: 'voice_log',
    emoji: '🎥',
    description: 'Triggered when a member started streaming',
    implemented: true,
  },

  voiceCamera: {
    key: 'voiceCamera',
    label: 'Member Started On - Camera',
    category: 'voice_log',
    emoji: '📷',
    description: 'Triggered when a member started oncam',
    implemented: true,
  },

  // server_log ===============================================
  guildUpdate: {
    key: 'guildUpdate',
    label: 'Guild/Server Updated',
    category: 'server_log',
    emoji: '⚙️',
    description: 'Triggered when a guild was updated',
    implemented: true,
  },

  emojiCreate: {
    key: 'emojiCreate',
    label: 'Emoji Created',
    category: 'server_log',
    emoji: '🫩',
    description: 'Triggered when an emoji was created',
    implemented: false,
  },

  emojiDelete: {
    key: 'emojiDelete',
    label: 'Emoji Deleted',
    category: 'server_log',
    emoji: '🚫',
    description: 'Triggered when an emoji was deleted',
    implemented: false,
  },

  stickerUpdate: {
    key: 'stickerUpdate',
    label: 'Sticker Updated',
    category: 'server_log',
    emoji: '🏷️',
    description: 'Triggered when a sticker was updated',
    implemented: false,
  },
} as const satisfies Record<string, AuditEventDefs>;
