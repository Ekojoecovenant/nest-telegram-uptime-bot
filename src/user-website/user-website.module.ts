import { Module } from '@nestjs/common';
import { UserWebsiteService } from './user-website.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/domain/entities/user.entity';
import { Website } from 'src/domain/entities/website.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Website])],
  providers: [UserWebsiteService],
  exports: [UserWebsiteService],
})
export class UserWebsiteModule {}
