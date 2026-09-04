import { Cron, ScheduledTask } from "@slipher/scheduler";
import { UsingClient } from "seyfert";
import { DatabaseService } from "src/services/database/database";

// 30 DAYS LOGS RETENTION YOU CAN CHANGE THE RetD PERDAY(1 as number) OR PERMONTH
const RetD = 30;
const RetMs = RetD * 24 * 60 * 60 * 1000;

export class AnonLogCleaupTask {
  constructor(private client: UsingClient) {}

  @Cron('0 0 3 * * *', {id: 'anonlog-cleanup'})
  async handleCleanup(task: ScheduledTask) {
    this.client.logger.info(`Task: ${task.id} Cleaning up logs older than ${RetD} days...`);
    try {
      const del = DatabaseService.purgeOldAnonLogs(RetMs);
      if (del > 0) {
        this.client.logger.info(`Purged ${del} anon logs row(s) older than ${RetD} days.`);
        DatabaseService.vacuumAdmin();
      }
    } catch (err) {
      this.client.logger.error(`ERROR on AnonLog cleanup Task:`, err);
    }
  }
}
