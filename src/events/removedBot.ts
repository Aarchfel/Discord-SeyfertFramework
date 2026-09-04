import { createEvent } from "seyfert";
import { DatabaseService } from "src/services/database/database";

export default createEvent({
  data: {name: 'guildDelete'},
  run(guild, client) {
    if (!('name' in guild) || guild.unavailable){
      client.logger.info(`Bot removed from guild: ${guild.id}`);
      return;
    }
    
    client.logger.info(`Bot removed from guild: ${guild.name} ( ${guild.id} )`);
  
    try {
      DatabaseService.purgeGuild(guild.id);
      console.log(`[DB] Deleted guild config for guild ${guild.id}`);
    } catch (err) {
      console.error(`[DB] Failed to delete guild config for guild ${guild.id}:`, err);
    }
  }
});
