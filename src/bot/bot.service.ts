import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Bot } from 'grammy';
import { MyContext } from './types';
import { ConfigService } from '@nestjs/config';
import { conversations, createConversation } from '@grammyjs/conversations';
import { addWebsiteConversation } from './conversations/add-website.conv';
import { mainMenu } from './menus/main.menu';

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  public bot: Bot<MyContext>;
  private readonly logger = new Logger(BotService.name);

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');

    if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set in .env');

    this.bot = new Bot<MyContext>(token);

    // install conversations plugin
    this.bot.use(conversations());

    // Register the conversation handler
    this.bot.use(createConversation(addWebsiteConversation, 'add-website'));

    // Install main menu directly
    this.bot.use(mainMenu);

    // /start command to show the menu
    this.bot.command('start', async (ctx) => {
      await ctx.reply(
        'Welcome to Uptime Monitor Bot! 👀\n\nMonitor your websites easily.',
        {
          reply_markup: mainMenu,
        },
      );
    });

    // register global error handler
    this.bot.catch((err) => {
      const ctx = err.ctx;
      this.logger.log(`Error while handling update ${ctx?.update.update_id}:`);
      this.logger.log(err.error);
    });
  }

  async onModuleInit() {
    this.logger.log('Starting Telegram bot polling...');
    await this.bot.start();
  }

  async onModuleDestroy() {
    this.logger.log('Stopping Telegram bot...');
    await this.bot.stop();
  }
}
