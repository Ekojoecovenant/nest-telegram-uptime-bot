import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { StartHandler } from './handlers/start.handler';
import { AddWebsiteConversation } from './conversations/add-website.conv';
import { UserWebsiteModule } from 'src/user-website/user-website.module';

@Module({
  imports: [UserWebsiteModule],
  providers: [BotService, StartHandler, AddWebsiteConversation],
  exports: [BotService],
})
export class BotModule {}
