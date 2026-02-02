import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StartHandler } from './handlers/start.handler';
import { Menu } from '@grammyjs/menu';
import { AddWebsiteConversation } from './conversations/add-website.conv';
import { conversations, createConversation } from '@grammyjs/conversations';
import { Bot } from 'grammy';
import type { MyContext } from './types';

@Injectable()
export class BotService implements OnModuleInit {
  private readonly logger = new Logger(BotService.name);
  private readonly bot: Bot<MyContext>;

  constructor(
    private config: ConfigService,
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

    // 3: update the "Add Website" button in the menu
    const mainMenu = new Menu<MyContext>('main-menu')
      .text('➕ Add Website', async (ctx) => {
        await ctx.answerCallbackQuery();
        // Enter the conversation!
        await ctx.conversation.enter('add-website');
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
          { reply_markup: mainMenu },
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
  // getBot(): Bot {
  //   return this.bot;
  // }
}
