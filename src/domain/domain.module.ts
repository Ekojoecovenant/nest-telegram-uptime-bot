import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Website } from './website.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Website])],
  exports: [TypeOrmModule],
})
export class DomainModule {}
