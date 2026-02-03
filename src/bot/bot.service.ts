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

    this.myWebsitesMenu = createMyWebsitesMenu(this.userWebsiteService);

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
