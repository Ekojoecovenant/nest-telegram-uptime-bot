import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Bot, webhookCallback } from 'grammy';
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
import { InjectRepository } from '@nestjs/typeorm';
import { Website } from 'src/domain/website.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  public bot: Bot<MyContext>;
  private readonly logger = new Logger(BotService.name);
  private myWebsitesMenu: Menu<MyContext>;

  constructor(
    private configService: ConfigService,
    private userWebsiteService: UserWebsiteService,
    private monitorService: MonitorService,
    @InjectRepository(Website)
    private websiteRepo: Repository<Website>,
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

    this.myWebsitesMenu = createMyWebsitesMenu(
      this.userWebsiteService,
      this.monitorService,
    );

    // Install main menu directly
    this.bot.use(mainMenu);
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

    // register global error handler
    this.bot.catch((err) => {
      const ctx = err.ctx;
      this.logger.log(`Error while handling update ${ctx?.update.update_id}:`);
      this.logger.log(err.error);
    });

    this.bot.on('callback_query:data', async (ctx) => {
      const data = ctx.callbackQuery.data;

      // Delete website callback
      if (data?.startsWith('delete:')) {
        const websiteId = data.split(':')[1];
        await ctx.answerCallbackQuery({ text: 'Deleting...' });

        // delete logic
        await this.userWebsiteService.removeWebsiteFromUser(
          ctx.from.id.toString(),
          websiteId,
        );

        // await ctx.menu.update();
        await ctx.editMessageText(
          'Website removed successfully. Refresh list if needed.',
        );
        // or ctx.menu.update() to refresh submenu dynamically
      }

      // Check Now callback
      if (data?.startsWith('check:')) {
        const websiteId = data.split(':')[1];
        await ctx.answerCallbackQuery({ text: 'Checking...' });

        const website = await this.websiteRepo.findOneBy({ id: websiteId });
        if (website) {
          const updated = await this.monitorService.checkWebsite(website);
          await ctx.editMessageText(
            `Checked ${updated.url}:\nStatus: ${getStatusEmoji(updated.status)}`,
          );
        }
      }

      // Back to list callback
      if (data === 'back-to-my-websites') {
        ctx.menu.nav('my-websites-menu');
      }
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
      const secretToken =
        'your-random-secret-' + Math.random().toString(36).slice(2);

      await this.bot.api.setWebhook(fullWebhookUrl, {
        allowed_updates: ['message', 'callback_query', 'inline_query'], // add what you use
        secret_token: secretToken, // optional but recommended
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
