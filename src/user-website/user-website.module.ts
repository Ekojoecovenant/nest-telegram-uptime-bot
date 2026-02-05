import { Module } from '@nestjs/common';
import { UserWebsiteService } from './user-website.service';

@Module({
  providers: [UserWebsiteService],
  exports: [UserWebsiteService],
})
export class UserWebsiteModule {}
