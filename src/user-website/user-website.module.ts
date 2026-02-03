import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/domain/user.entity';
import { Website } from 'src/domain/website.entity';
import { UserWebsiteService } from './user-website.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Website])],
  providers: [UserWebsiteService],
  exports: [UserWebsiteService],
})
export class UserWebsiteModule {}
