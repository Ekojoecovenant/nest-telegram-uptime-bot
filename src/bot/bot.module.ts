import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { UserWebsiteService } from 'src/user-website/user-website.service';
import { MonitorService } from 'src/monitor/monitor.service';
import { DomainModule } from 'src/domain/domain.module';

@Module({
  imports: [
    // Entity Module
    DomainModule,
  ],
  providers: [BotService, UserWebsiteService, MonitorService],
  exports: [BotService],
})
export class BotModule {}
