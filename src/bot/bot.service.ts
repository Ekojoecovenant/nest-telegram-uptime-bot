import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Bot, InlineKeyboard } from 'grammy';
import { MyContext } from './types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  public bot: Bot<MyContext>;
  private readonly logger = new Logger(BotService.name);

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');

    if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set in .env');

    this.bot = new Bot<MyContext>(token, {
      // parse_mode
    });
  }

  async onModuleInit() {
    // register global error handler
    this.bot.catch((err) => {
      const ctx = err.ctx;
      this.logger.log(`Error while handling update ${ctx?.update.update_id}:`);
      this.logger.log(err.error);
    });

    // /start command
    this.bot.command('start', async (ctx) => {
      await ctx.reply(
        'Welcome to Uptime Monitor Bot! 👀\n\n' +
          'I can watch your websites and tell you when they go down.\n' +
          'Use the menu below to get started.',
        {
          reply_markup: new InlineKeyboard()
            .text('Add Website', 'add-website')
            .row()
            .text('My Websites', 'my-websites'),
        },
      );
    });

    // placeholder callback handlers
    this.bot.on('callback_query:data', async (ctx) => {
      const data = ctx.callbackQuery.data;

      if (data === 'add-website') {
        await ctx.answerCallbackQuery({ text: 'Starting add flow...' });
        await ctx.reply('Add flow coming soon!');
      } else if (data === 'my-websites') {
        await ctx.answerCallbackQuery({ text: 'Loading your sites...' });
        await ctx.reply('Your websites list coming soon!');
      } else {
        await ctx.answerCallbackQuery({ text: 'Unknown action' });
      }
    });

    this.logger.log('Starting Telegram bot polling...');
    await this.bot.start();
  }

  async onModuleDestroy() {
    this.logger.log('Stopping Telegram bot...');
    await this.bot.stop();
  }
}
