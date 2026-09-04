import { definePlugins } from 'seyfert';
import { cooldown, type CooldownResult } from '@slipher/cooldown';
import { memory, scheduler } from '@slipher/scheduler';
import { QOTDTask } from './tasks/qotd.js';
import { AnonLogCleaupTask } from './tasks/anonlogCleanup.js';

const tasks = [QOTDTask, AnonLogCleaupTask];

const schedule = scheduler({
  driver: memory(),
  tasks,
});

export const plug = definePlugins(
  cooldown({
    components: true,
    modals: true,
    middleware: {
      global: true,
      message: (res: CooldownResult) => {
        const sec = Math.ceil(res.remainingMs / 1000);
        return `You are on cooldown for this command, Please wait \`${sec} second${sec > 1 ? 's' : ''}\` before using it again`;
      },
    },
  }),
  schedule,
);
