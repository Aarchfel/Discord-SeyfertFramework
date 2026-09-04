import './seyfert.d.ts';
import { Client, MessageFlags } from 'seyfert';
import { createMusicClient } from './hoshimi.js';
import { QOTDTask } from './tasks/qotd.js';
import { AnonLogCleaupTask } from './tasks/anonlogCleanup.js';
import { loadAnonChCache } from './utils/cache/anonWebhook.js';
import { plug } from './plugins.js';

const client = new Client({
  plugins: plug,

  commands: {
    defaults: {
      onRunError: (ctx, error) => {
        client.logger.error(`[Command Error] /${ctx.fullCommandName}:`, error);

        const errmsg = error instanceof Error ? error.message : String(error);

        ctx
          .editOrReply({
            content: `An error occurred while executing the command, Please ask the developers to fix this\nErr: \`${errmsg}\``,
            flags: MessageFlags.Ephemeral,
          })
          .catch((err) =>
            client.logger.error(`Failed to send error message to user: ${err}`),
          );
      },

      onOptionsError: (ctx, metadata) => {
        client.logger.warn(`[Opt Error] /${ctx.fullCommandName}:`, metadata);

        ctx
          .editOrReply({
            content: `Invalid options provided for the command, Please check the command usage\nErr: \`${metadata.reason}\``,
            flags: MessageFlags.Ephemeral,
          })
          .catch((err) =>
            client.logger.error(`Failed to send error message to user: ${err}`),
          );
      },

      onPermissionsFail: (ctx, perms) => {
        ctx
          .editOrReply({
            content: `You do not have permission to use this command.\n> (Missing: \`${perms.join(', ')}\`)`,
            flags: MessageFlags.Ephemeral,
          })
          .catch((err) =>
            client.logger.error(`Failed to send error message to user: ${err}`),
          );
      },

      onBotPermissionsFail: (ctx, perms) => {
        ctx
          .editOrReply({
            content: `I do not have permission to execute this command.\n> (Missing: \`${perms.join(', ')}\`)`,
            flags: MessageFlags.Ephemeral,
          })
          .catch((err) =>
            client.logger.error(`Failed to send error message to user: ${err}`),
          );
      },

      onMiddlewaresError: (ctx, error) => {
        ctx
          .editOrReply({
            content:
              typeof error === 'string'
                ? error
                : `An error occurred while executing the command, Please ask the developers to fix this`,
            flags: MessageFlags.Ephemeral,
          })
          .catch((err) =>
            client.logger.error(`Failed to send error message to user: ${err}`),
          );
      },

      onInternalError: (client, error) => {
        client.logger.fatal(
          `An internal error occurred while executing the command: ${error instanceof Error ? error.message : String(error)}`,
        );
      },
    },
  },

  components: {
    defaults: {
      onRunError: (ctx, error) => {
        client.logger.error(`[Components Err]:`, error);
        const errmsg = error instanceof Error ? error.message : String(error);

        ctx
          .editOrReply({
            content: `An error occurred while executing the component, Please ask the developers to fix this\nErr: \`${errmsg}\``,
            flags: MessageFlags.Ephemeral,
          })
          .catch((err) => client.logger.error(err));
      },
    },
  },

  modals: {
    defaults: {
      onRunError: (ctx, error) => {
        client.logger.error(`[Modal Err]:`, error);
        const errmsg = error instanceof Error ? error.message : String(error);

        ctx
          .editOrReply({
            content: `An error occurred while executing the modal, Please ask the developers to fix this\nErr: \`${errmsg}\``,
            flags: MessageFlags.Ephemeral,
          })
          .catch((err) => client.logger.error(err));
      },
    },
  },
});

// Register tasks
// client.scheduler.register([new QOTDTask(client)]);

// NOTE: IF A LOT TASK
/*
const tasks =[QOTDTask, balblabla, blablalbal];
*/

// HOSHIMI
createMusicClient(client);

// Start bot & upload slash commands to discord API
client
  .start()
  .then(() => client.uploadCommands({ cachePath: './commands.json' }));

// LOAD CACHE ANONYMOUS
loadAnonChCache();
