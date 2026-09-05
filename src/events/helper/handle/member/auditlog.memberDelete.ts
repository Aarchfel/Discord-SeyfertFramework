import { ButtonStyle, Formatter, Guild, UsingClient } from 'seyfert';
import { AuditEvents } from 'src/utils/auditlog/auditEvents';
import { dispatchAuditlog } from 'src/utils/auditlog/dispatch';
import {
  accountAgeLabel,
  discordTimestamp,
  snowflakeToDate,
} from 'src/utils/formatter/label';

export async function handleAuditLogMemberDelete(
  mem: any,
  client: UsingClient,
  guild: Guild,
) {
  const user = mem.user;
  const createdAt = snowflakeToDate(user.id);
  const joinedAt =
    'joinedAt' in mem && mem.joinedAt ? new Date(mem.joinedAt) : null;

  const rId = 'roles' in mem ? mem.roles.keys : [];
  const fRId = rId.filter((r: any) => r !== guild.id);
  const fRIdStr = fRId.map((r: any) => Formatter.roleMention(r)).join(', ');

  await dispatchAuditlog(client, guild.id, AuditEvents.guildMemberRemove, {
    targetTag: `${Formatter.userMention(user.id)} - ${user.username} (\`${user.id}\`)`,
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
        value: joinedAt
          ? `${discordTimestamp(joinedAt, 'F')} (${discordTimestamp(joinedAt, 'R')})`
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
    ],
  });
}
