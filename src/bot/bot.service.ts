import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot, Context } from 'grammy';
import { StartHandler } from './handlers/start.handler';
import { Menu } from '@grammyjs/menu';

@Injectable()
export class BotService implements OnModuleInit {
  private readonly logger = new Logger(BotService.name);
  private readonly bot: Bot;

  constructor(
    private config: ConfigService,
    private startHandler: StartHandler,
  ) {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN not set');
    this.bot = new Bot(token);
  }

  async onModuleInit() {
    // basic global error handler
    this.bot.catch((err) => {
      this.logger.error('Bot error occurred', err);
    });

    // registers handlers
    this.bot.command('start', (ctx) => this.startHandler.handle(ctx));

    // simple main menu (will expand)
    const mainMenu = new Menu<Context>('main-menu')
      .text('➕ Add Website', async (ctx) => {
        await ctx.answerCallbackQuery();
        await ctx.reply(
          '🌐 Send the website URL to monitor\n(e.g. https://example.com)',
        );
        // next step: handle incoming text messages (later with conversations)
      })
      .row()
      .text('📋 My Websites', async (ctx) => {
        await ctx.answerCallbackQuery();
        await ctx.editMessageText('No websites added yet.', {
          reply_markup: mainMenu, // keep menu
        });
      })
      .row()
      .text('ℹ️ Help', async (ctx) => {
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(
          'Monitor websites * Alerts on down/up * 1 min checks',
          {
            reply_markup: mainMenu,
          },
        );
      });

    this.bot.use(mainMenu);

    this.bot.command('start', async (ctx) => {
      await ctx.reply(
        '👋🏻 Welcome to Uptime Monitor Bot\nTrack your websites right here.',
        { reply_markup: mainMenu },
      );
    });

    // Start polling
    await this.bot.start();
    this.logger.log('Bot started (pooling)');
  }

  getBot(): Bot {
    return this.bot;
  }
}
