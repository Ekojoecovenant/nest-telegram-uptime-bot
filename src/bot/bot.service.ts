import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StartHandler } from './handlers/start.handler';
import { AddWebsiteConversation } from './conversations/add-website.conv';
import { conversations, createConversation } from '@grammyjs/conversations';
import { Bot } from 'grammy';
import type { MyContext } from './types';
import { createMainMenu } from './menus/main.menu';
import { UserWebsiteService } from 'src/user-website/user-website.service';

@Injectable()
export class BotService implements OnModuleInit {
  private readonly logger = new Logger(BotService.name);
  private readonly bot: Bot<MyContext>;

  constructor(
    private config: ConfigService,
    private userWebsiteService: UserWebsiteService,
    private startHandler: StartHandler,
    private addWebsiteConv: AddWebsiteConversation,
  ) {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN not set');
    this.bot = new Bot<MyContext>(token);
  }

  async onModuleInit() {
    // basic global error handler
    this.bot.catch((err) => {
      this.logger.error('Bot error occurred', err);
    });

    // Register conversations middleware (very important!)
    this.bot.use(conversations());

    // Register your conversation
    this.bot.use(
      createConversation(
        (conv, ctx) => this.addWebsiteConv.addWebsite(conv, ctx as MyContext),
        'add-website', // unique name for this flow
      ),
    );

    // main menu
    const mainMenu = createMainMenu(this.userWebsiteService);

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
  // getBot(): Bot {
  //   return this.bot;
  // }
}
