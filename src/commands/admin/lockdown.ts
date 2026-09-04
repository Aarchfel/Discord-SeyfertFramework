import { Cooldown } from '@slipher/cooldown';
import {
  Command,
  createBooleanOption,
  Declare,
  MessageFlags,
  Options,
  OverwriteType,
  PermissionFlagsBits,
  PermissionStrings,
  type CommandContext,
} from 'seyfert';
import { PermissionsBitField } from 'seyfert/lib/structures/extra/Permissions';

const opt = {
  server_wide: createBooleanOption({
    description: 'Lockdown ALL text channels in this server (default: false)',
    required: false,
  }),
};

const locKPerm = [
  'SendMessages',
  'SendMessagesInThreads',
  'CreatePublicThreads',
  'CreatePrivateThreads',
] as const;

const primLockPerm: (typeof locKPerm)[number] = locKPerm[0];
const primLockbit = PermissionFlagsBits.SendMessages;

@Declare({
  name: 'lockdown',
  description:
    'Toggle On/Off lockdown for @everyone (sendMessages perms). THIS IS EXTREMELY DANGEROUS',
  defaultMemberPermissions: ['Administrator'],
  integrationTypes: ['GuildInstall'],
})
@Options(opt)
@Cooldown.guild(10_000)
export default class LockdownCommand extends Command {
  async run(ctx: CommandContext<typeof opt>) {
    const guild = await ctx.guild();
    if (!guild) return;

    const { server_wide } = ctx.options;
    await ctx.deferReply();

    const everyoneId = guild.id;

    // PER SERVER
    if (server_wide) {
      const role = await guild.roles.list();
      const everyone = role.find((r) => r.id === everyoneId);

      if (!everyone) {
        return ctx.editOrReply({
          content: 'Failed to find @everyone role.',
          flags: MessageFlags.Ephemeral,
        });
      }

      const isLocked = !everyone.permissions.has(primLockbit);
      const shouldLock = !isLocked;

      const newPerm = new PermissionsBitField(everyone.permissions.bits);
      for (const perm of locKPerm) {
        const bit = PermissionFlagsBits[perm];
        if (shouldLock) newPerm.remove([bit]);
        else newPerm.add([bit]);
      }

      try {
        await everyone.edit(
          { permissions: newPerm.bits.toString() },
          `Server-wide Lockdown by ${ctx.author.tag}`,
        );
      } catch (e) {
        return ctx.editOrReply({
          content: `Failed to update @everyone role.\n\nReason: ${e}`,
          flags: MessageFlags.Ephemeral,
        });
      }

      return ctx.editOrReply({
        content: `# __SERVER LOCKDOWN__\nLockdown ${shouldLock ? '</> `enabled`' : '</> `disabled`'} for \`@everyone\` Server Wide!`,
      });
    }

    // PER CHANNEL
    const currCh = await ctx.channel();
    if (!currCh || !currCh.isGuildTextable()) {
      return ctx.editOrReply({
        content: 'This command can only be used in a text channel.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const fresh = await currCh.fetch();
    if (!fresh || !fresh.isGuildTextable()) return;

    const overwrites = fresh.permissionOverwrites.values().flat();
    const ovw = overwrites.find((o) => o.id === everyoneId);
    const currAllow = (ovw?.allow.keys() ?? []) as PermissionStrings;
    const currDeny = (ovw?.deny.keys() ?? []) as PermissionStrings;

    const isLocked = currDeny.includes(primLockPerm);
    const shouldLock = !isLocked;

    const isLockPerm = (p: string | bigint) =>
      (locKPerm as readonly (string | bigint)[]).includes(p);

    const allow = currAllow.filter((p) => !isLockPerm(p)) as PermissionStrings;
    const deny = shouldLock
      ? (Array.from(new Set([...currDeny, ...locKPerm])) as PermissionStrings)
      : (currDeny.filter((p) => !isLockPerm(p)) as PermissionStrings);

    if (!shouldLock && allow.length === 0 && deny.length === 0 && ovw) {
      await fresh.permissionOverwrites.delete(
        everyoneId,
        `Channel Unlock by ${ctx.author.tag}`,
      );
    } else {
      await fresh.permissionOverwrites.edit(
        everyoneId,
        {
          allow,
          deny,
          type: OverwriteType.Role,
        },
        `Channel Lockdown by ${ctx.author.tag}`,
      );
    }
    return ctx.editOrReply({
      content: `# __CHANNEL LOCKDOWN__\nLockdown ${shouldLock ? '</> `enabled`' : '</> `disabled`'} for \`@everyone\` in ${currCh}!`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
