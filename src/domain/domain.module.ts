import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Website } from './entities/website.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Website])],
  exports: [TypeOrmModule],
})
export class DomainModule {}
