import { Module } from '@nestjs/common';
import { BotModule } from './bot/bot.module';
import { AppConfigModule } from './common/config/config.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    // env config
    AppConfigModule,

    // typeorm config
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite', // file-based for dev
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // auto-create tables (dev only!)
      logging: ['error', 'warn'],
    }),

    // bot module
    BotModule,
  ],
})
export class AppModule {}
