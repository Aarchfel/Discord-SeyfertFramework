import { Cooldown } from '@slipher/cooldown';
import {
  Command,
  CommandContext,
  createBooleanOption,
  createIntegerOption,
  createUserOption,
  Declare,
  type Message,
  Options,
  MessageFlags,
  createStringOption,
} from 'seyfert';

const opt = {
  amount: createIntegerOption({
    description: 'Amount of messages to delete (1 - 500)',
    required: true,
    min_value: 1,
    max_value: 500,
  }),

  contains: createStringOption({
    description: 'Only delete messages containing this text (optional)',
    required: false,
  }),

  target: createUserOption({
    description: 'Only delete messages from this user (optional)',
    required: false,
  }),

  bots: createBooleanOption({
    description: 'Only delete messages from bots (optional)',
    required: false,
  }),

  attachments: createBooleanOption({
    description: 'Only delete messages with attachments (optional)',
    required: false,
  }),
};

@Declare({
  name: 'purge',
  description: 'Purge messages (max 500)',
  defaultMemberPermissions: ['ManageMessages'],
  integrationTypes: ['GuildInstall'],
})
@Options(opt)
@Cooldown.channel(10_000)
export default class PurgeCommand extends Command {
  async run(ctx: CommandContext<typeof opt>) {
    const { amount, contains, target, bots, attachments } = ctx.options;

    if (target && !target.bot && bots) {
      return ctx.editOrReply({
        content: 'Target user must be a bot if bots_only is true.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await ctx.deferReply();
    const deferMsgId = (await ctx.fetchResponse()).id;

    const ch = await ctx.channel();
    if (!ch || !ch.isTextable()) {
      return ctx.editOrReply({
        content: 'This command can only be used in a text channel.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const daysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const scanLim = 100;
    let totalDel = 0;
    let lastMsgId: string | undefined;
    let hit = false;

    while (totalDel < amount) {
      const listMsg = await ch.messages.list({
        limit: scanLim,
        ...(lastMsgId ? { before: lastMsgId } : {}),
      });

      if (!listMsg.length) break;

      lastMsgId = listMsg[listMsg.length - 1].id;

      const validMsg: Message[] = [];

      for (const msg of listMsg) {
        if (msg.createdAt.getTime() <= daysAgo) {
          hit = true;
          break;
        }

        if (msg.id === deferMsgId) continue;
        if (target && msg.author.id !== target.id) continue;
        if (bots && !msg.author.bot) continue;
        if (attachments && (!msg.attachments || msg.attachments.length === 0))
          continue;

        if (contains) {
          const keyword = contains?.toLowerCase();

          if (keyword) {
            const content = msg.content.toLowerCase() ?? '';
            if (!content.includes(keyword)) continue;
          }
        }

        validMsg.push(msg);
        if (totalDel + validMsg.length >= amount) break;
      }

      if (validMsg.length > 0) {
        const msgId = validMsg.map((m) => m.id);

        try {
          if (msgId.length === 1) {
            await ch.messages.delete(msgId[0]);
          } else {
            for (let i = 0; i < msgId.length; i += 100) {
              const chunk = msgId.slice(i, i + 100);
              await ch.messages.purge(chunk);
            }
          }

          totalDel += validMsg.length;
        } catch (err) {
          ctx.client.logger.error(`Failed to purge messages: ${err}`);
          break;
        }
      }

      if (listMsg.length < scanLim) break;
    }

    const filtInfo: string[] = [];
    if (target) filtInfo.push(`User: ${target.tag}`);
    if (bots) filtInfo.push('Bots Only');
    if (attachments) filtInfo.push('Attachments Only');
    if (contains) filtInfo.push(`Contains: ${contains}`);

    const filtText = filtInfo.length
      ? `\n\`Filter\` ${filtInfo.join(', ')}`
      : '';

    const staleNote = hit
      ? `\n\n*Messages older than 14 days will not be deleted.*`
      : '';

    if (totalDel === 0) {
      return ctx.editOrReply({
        content: `No messages found (Message must be less than 14 days old or not matched the filter).${filtText}`,
      });
    }

    return ctx.editOrReply({
      content: `Purged __\`${totalDel}\`__ message${totalDel === 1 ? '' : 's'}${filtText}${staleNote}`,
    });
  }
}
