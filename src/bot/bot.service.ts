/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Bot, InlineKeyboard, webhookCallback } from 'grammy';
import { MyContext } from './types';
import { ConfigService } from '@nestjs/config';
import { conversations, createConversation } from '@grammyjs/conversations';
import {
  addWebsiteConversation,
  getStatusEmoji,
} from './conversations/add-website.conv';
import { mainMenu } from './menus/main.menu';
import { UserWebsiteService } from 'src/user-website/user-website.service';
import { MonitorService } from 'src/monitor/monitor.service';
import { createMyWebsitesMenu } from './menus/my-websites.menu';
import { Menu } from '@grammyjs/menu';

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  public bot: Bot<MyContext>;
  private readonly logger = new Logger(BotService.name);
  private myWebsitesMenu: Menu<MyContext>;
  private websiteDetailMenu: Menu<MyContext>;

  constructor(
    private configService: ConfigService,
    private userWebsiteService: UserWebsiteService,
    private monitorService: MonitorService,
  ) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');

    if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set in .env');

    this.bot = new Bot<MyContext>(token);

    // install conversations plugin
    this.bot.use(conversations());

    // Register the conversation handler
    this.bot.use(
      createConversation(
        (conv, ctx) =>
          addWebsiteConversation(
            conv,
            ctx as MyContext,
            this.userWebsiteService,
          ),
        'add-website',
      ),
    );
    // this.bot.use(createConversation(addWebsiteConversation, 'add-website'));

    // Install main menu directly
    this.bot.use(mainMenu);

    // create and register submenus
    this.myWebsitesMenu = createMyWebsitesMenu(
      this.userWebsiteService,
      this.monitorService,
    );

    mainMenu.register(this.myWebsitesMenu);

    // /start command to show the menu
    this.bot.command('start', async (ctx) => {
      await ctx.reply(
        'Welcome to Uptime Monitor Bot! 👀\n\nMonitor your websites easily.',
        {
          reply_markup: mainMenu,
        },
      );
    });

    // Global callback handler
    this.bot.on('callback_query:data', async (ctx) => {
      const data = ctx.callbackQuery.data;
      if (!data) return;

      await ctx.answerCallbackQuery({ text: 'Processing...' });

      const telegramId = ctx.from.id.toString();

      try {
        if (data.startsWith('detail:')) {
          const siteId = data.split(':')[1];
          const site = await this.userWebsiteService.websiteRepo.findOne({
            where: { id: siteId },
          });

          if (!site) return;

          const emoji = getStatusEmoji(site.status);
          const detailText =
            `🌐 **${site.url}**\n\n` +
            `Status: ${emoji} ${site.status.toUpperCase()}${site.lastErrorReason ? ` (${site.lastErrorReason})` : ''}\n` +
            `Last check: ${site.lastCheckedAt ? site.lastCheckedAt.toLocaleDateString() : 'Never'}\n` +
            `Response time: ${site.lastResponseTimeMs ? site.lastResponseTimeMs + ' ms' : 'N/A'}`;

          const keyboard = new InlineKeyboard()
            .text('🔄️ Check Now', `check:${site.id}`)
            .row()
            .text('🗑️ Delete', `delete:${site.id}`)
            .row()
            .text('← Back to list', 'back-to-list');

          await ctx.editMessageText(detailText, {
            parse_mode: 'Markdown',
            reply_markup: keyboard,
          });
        }

        // Check Now callback
        else if (data?.startsWith('check:')) {
          const websiteId = data.split(':')[1];
          const site = await this.userWebsiteService.websiteRepo.findOneBy({
            id: websiteId,
          });

          if (site) {
            const updated = await this.monitorService.checkWebsite(site);

            // Re-build detail text with updated data
            const emoji = getStatusEmoji(site.status);
            const newText =
              `🌐 **${updated.url}**\n\n` +
              `Status: ${emoji} ${updated.status.toUpperCase()}${updated.lastErrorReason ? ` (${updated.lastErrorReason})` : ''}\n` +
              `Last check: ${updated.lastCheckedAt ? updated.lastCheckedAt.toLocaleDateString() : 'Never'}\n` +
              `Response time: ${updated.lastResponseTimeMs ? updated.lastResponseTimeMs + ' ms' : 'N/A'}`;

            const keyboard = new InlineKeyboard()
              .text('🔄️ Check Now', `check:${updated.id}`)
              .row()
              .text('🗑️ Delete', `delete:${updated.id}`)
              .row()
              .text('← Back to list', 'back-to-my-websites');

            await ctx.editMessageText(newText, {
              parse_mode: 'Markdown',
              reply_markup: keyboard,
            });
          }
        }

        // Delete website callback
        else if (data?.startsWith('delete:')) {
          const siteId = data.split(':')[1];

          await this.userWebsiteService.removeWebsiteFromUser(
            telegramId,
            siteId,
          );

          await ctx.editMessageText('🗑️ Website deleted successfully');
        }

        // Back to list callback
        else if (data === 'back-to-my-websites') {
          await ctx.editMessageText(
            'Welcome to Uptime Monitor Bot! 👀\n\nMonitor your websites easily.',
            {
              reply_markup: this.myWebsitesMenu,
            },
          );
        }
      } catch (err: any) {
        console.log(err.error_code);
        console.log(err.description);
        if (
          err.error_code === 400 &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          err.description.startsWith('Bad Request: message is not modified:')
        ) {
          console.log('Red notice');
        } else {
          this.logger.error(`Callback query error: ${err.message}`);
          await ctx.editMessageText(`Something went wrong: ${err.message}`);
        }
      }
    });

    // register global error handler
    this.bot.catch((err) => {
      const ctx = err.ctx;
      this.logger.log(`Error while handling update ${ctx?.update.update_id}:`);
      this.logger.log(err.error);
    });
  }

  async onModuleInit() {
    const webhookUrl = this.configService.get<string>('TELEGRAM_WEBHOOK_URL');
    const webhookPath = this.configService.get<string>('TELEGRAM_WEBHOOK_PATH');

    if (webhookUrl) {
      // WEBHOOK MODE
      const fullWebhookUrl = webhookUrl.endsWith('/')
        ? webhookUrl + webhookPath?.slice(1)
        : webhookUrl + webhookPath;

      this.logger.log(`Setting up webhook at: ${fullWebhookUrl}`);

      // secret token for security
      // const secretToken =
      //   'your-random-secret-' + Math.random().toString(36).slice(2);

      await this.bot.api.setWebhook(fullWebhookUrl, {
        allowed_updates: ['message', 'callback_query', 'inline_query'], // add what you use
        // secret_token: secretToken, // optional but recommended
      });

      this.logger.log('Webhook set successfully! Bot now in webhook mode.');
    } else {
      // POLLING MODE (fallback)
      this.logger.log('Starting Telegram bot polling...');
      await this.bot.start();
    }
  }

  async onModuleDestroy() {
    this.logger.log('Stopping Telegram bot...');
    await this.bot.stop();
  }

  getWebhookMiddleware() {
    return webhookCallback(this.bot, 'express');
  }
}
