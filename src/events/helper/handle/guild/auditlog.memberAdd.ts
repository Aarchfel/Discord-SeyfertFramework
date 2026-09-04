import { ButtonStyle, Client } from 'seyfert';
import { Formatter, Guild } from 'seyfert';
import { GuildMember } from 'seyfert';
import { AuditEvents } from 'src/utils/auditlog/auditEvents';
import { dispatchAuditlog } from 'src/utils/auditlog/dispatch';
import {
  accountAgeLabel,
  discordTimestamp,
  isNewAccount,
  snowflakeToDate,
} from 'src/utils/formatter/label';

export async function handleAuditLogMemberAdd(
  mem: GuildMember,
  client: Client<true>,
  guild: Guild,
  ctx: { used: any },
) {
  const user = mem.user;
  const createdAt = snowflakeToDate(user.id);
  const joinedAt = mem.joinedAt ? new Date(mem.joinedAt) : new Date();

  const wLines: string[] = [];
  if (isNewAccount(user.id)) {
    wLines.push(`This account is NEW ${accountAgeLabel(user.id)}`);
  }

  const rId = 'roles' in mem ? mem.roles.keys : [];
  const fRId = rId.filter((r) => r !== guild.id);
  const fRIdStr = fRId.map((r) => Formatter.roleMention(r)).join(', ');

  await dispatchAuditlog(client, guild.id, AuditEvents.guildMemberAdd, {
    targetTag: `${Formatter.userMention(user.id)} - ${user.username} (\`${user.id}\`)`,
    warningLines: wLines,
    fields: [
      {
        label: 'User ID',
        value: `\`${user.id}\``,
      },
      {
        label: 'Account Age',
        value: `__${accountAgeLabel(user.id)}__`,
      },
      {
        label: 'Account Created At',
        value: `${discordTimestamp(createdAt, 'F')} (${discordTimestamp(createdAt, 'R')})`,
      },
      {
        label: 'Joined At',
        value: `${discordTimestamp(joinedAt, 'F')} (${discordTimestamp(joinedAt, 'R')})`,
      },
      {
        label: 'Inviter',
        value: ctx.used.inviter
          ? `${Formatter.userMention(ctx.used.inviter.id)} - (https://discord.gg/${ctx.used.code} - ${ctx.used.uses} uses)`
          : 'N/A',
      },
      {
        label: `Role(s) [ ${fRId.length} ]`,
        value: fRId.length > 0 ? fRIdStr : 'N/A',
      },
    ],
    buttons: [
      {
        label: 'View User',
        style: ButtonStyle.Link,
        url: `https://discord.com/users/${user.id}`,
      },
      {
        label: 'Copy UserID',
        style: ButtonStyle.Secondary,
        customId: `copyid_${user.id}`,
      },
      {
        label: 'Ban User (⚠️⚠️⚠️)',
        style: ButtonStyle.Danger,
        customId: `userban_${user.id}`, // CHECK COMPONENTS TO SEE BAN LOGIC
      },
    ],
  });
}
