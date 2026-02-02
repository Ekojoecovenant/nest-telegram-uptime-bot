import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { StartHandler } from './handlers/start.handler';
import { AddWebsiteConversation } from './conversations/add-website.conv';

@Module({
  providers: [BotService, StartHandler, AddWebsiteConversation],
  exports: [BotService],
})
export class BotModule {}
