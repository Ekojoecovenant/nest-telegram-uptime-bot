import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { UserWebsiteService } from 'src/user-website/user-website.service';
import { MonitorService } from 'src/monitor/monitor.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Website } from 'src/domain/website.entity';
import { User } from 'src/domain/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Website])],
  providers: [BotService, UserWebsiteService, MonitorService],
  exports: [BotService],
})
export class BotModule {}
