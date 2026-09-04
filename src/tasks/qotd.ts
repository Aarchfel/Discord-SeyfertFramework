import { Cron, type ScheduledTask } from '@slipher/scheduler';
import {
  Client,
  Container,
  MessageFlags,
  Separator,
  TextDisplay,
} from 'seyfert';
import { config } from 'src/config';
import { getGuildConfig } from 'src/utils/database/guildConfig';

export class QOTDTask {
  constructor(private client: Client) {}
  // pos 1/value 1 = Seconds
  // pos 2/value 1 = Minutes
  // pos 3/value 1 = Hours
  // pos 4/value 1 = Day
  // pos 5/value 1 = Month
  // pos 6/value 1 = Weekday
  @Cron('0 0 0 * * *', { id: 'daily-qotd' })
  async handleQOTD(task: ScheduledTask) {
    this.client.logger.info(`Running Scheduled Task: ${task.id}`);

    try {
      const resp = await fetch(`https://api.harys.is-a.dev/v1/qotd`, {
        headers: { Authorization: config.qotdKey },
      });

      if (!resp.ok) {
        throw new Error(`HTTP ERR! Status: ${resp.status}`);
      }

      const dat = await resp.json();
      const quest = dat.questions?.[0];
      if (!quest) return;

      const container = new Container().addComponents(
        new TextDisplay().setContent(`# Question of the Day`),
        new Separator(),
        new TextDisplay().setContent(`## ${quest}`),
        new TextDisplay().setContent(
          'You may have to answer this question! :3',
        ),
      );

      const guilds = this.client.cache.guilds?.values() ?? [];

      for (const g of guilds) {
        const gcfg = getGuildConfig(g.id);
        if (!gcfg?.qotd_channel) continue;

        const ch = await this.client.channels
          .fetch(gcfg.qotd_channel)
          .catch(() => null);
        if (ch && ch.isTextable()) {
          await ch.messages
            .write({
              components: [container],
              flags: MessageFlags.IsComponentsV2,
            })
            .catch((err: any) => {
              this.client.logger.error(
                `Failed to send QOTD to the channel:`,
                err,
              );
            });
          this.client.logger.info(`Sent QOTD to guild: ${g.name} ( ${g.id} )`);
        }
      }
    } catch (err) {
      this.client.logger.error('Error on QOTD Task Scheduler:', err);
    }
  }
}
