import { Module } from '@nestjs/common';
import { BotModule } from './bot/bot.module';
import { AppConfigModule } from './common/config/config.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { DomainModule } from './domain/domain.module';
import { UserWebsiteModule } from './user-website/user-website.module';

@Module({
  imports: [
    // env config
    AppConfigModule,

    // typeorm config
    TypeOrmModule.forRootAsync({
      useFactory: getDatabaseConfig,
    }),
    // TypeOrmModule.forRoot({
    //   type: 'sqlite',
    //   database: 'db.sqlite', // file-based for dev
    //   entities: [__dirname + '/**/*.entity{.ts,.js}'],
    //   synchronize: true, // auto-create tables (dev only!)
    //   logging: ['error', 'warn'],
    // }),

    // modules
    BotModule,
    DomainModule,
    UserWebsiteModule,
  ],
})
export class AppModule {}
