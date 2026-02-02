import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { StartHandler } from './handlers/start.handler';

@Module({
  providers: [BotService, StartHandler],
  exports: [BotService],
})
export class BotModule {}
