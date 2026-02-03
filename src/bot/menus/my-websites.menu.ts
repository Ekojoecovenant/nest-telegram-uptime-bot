import { Menu, MenuRange } from '@grammyjs/menu';
import { UserWebsiteService } from 'src/user-website/user-website.service';
import { MyContext } from '../types';
// import { InlineKeyboard } from 'grammy';
import { Logger } from '@nestjs/common';
import { getStatusEmoji } from '../conversations/add-website.conv';

const logger = new Logger('MyWebsiteMenu');

export function createMyWebsitesMenu(userWebsiteService: UserWebsiteService) {
  const menu = new Menu<MyContext>('my-websites-menu');

  menu.dynamic(async (ctx, range: MenuRange<MyContext>) => {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) {
      range.text('Error: Cannot identify user', () => {});
      return range;
    }

    try {
      const websites = await userWebsiteService.getUserWebsites(telegramId);

      if (websites.length === 0) {
        range
          .text('No websites added yet', async (ctx) => {
            await ctx.answerCallbackQuery({ text: 'Add some first!' });
          })
          .row();
      } else {
        websites.forEach((site) => {
          const emoji = getStatusEmoji(site.status);
          const shortUrl =
            site.url.length > 35 ? site.url.slice(0, 32) + '...' : site.url;

          range
            .text(`${emoji} ${shortUrl}`, async (ctx) => {
              // Open detail view
              await ctx.reply(
                `🌐 **${site.url}**\n\n` +
                  `Status: ${emoji} ${site.status.toUpperCase()}\n` +
                  `Last check: ${site.lastCheckedAt?.toLocaleString() || 'Never'}\n` +
                  `Response time: ${site.lastResponseTimeMs ? site.lastResponseTimeMs + 'ms' : 'N/A'}`,
                {
                  parse_mode: 'Markdown',
                  reply_markup: {
                    inline_keyboard: [
                      [
                        {
                          text: '🔄️ Check Now',
                          callback_data: `check:${site.id}`,
                        },
                      ],
                      [
                        {
                          text: '← Back to list',
                          callback_data: 'back-to-my-websites',
                        },
                      ],
                    ],
                  },
                  // reply_markup: new InlineKeyboard().text(
                  //   'Check Now',
                  //   `check:${site.id}`,
                  // ),
                },
              );
              await ctx.answerCallbackQuery();
            })
            .row();
        });
      }

      range.row().back('← Main Menu');
    } catch (err) {
      logger.error(`Error loading websites in menu: ${err}`);
      range.text('Error loading list', () => {}).row();
      range.back('← Main Menu');
    }

    return range;
  });

  return menu;
}

// function getStatusEmoji(status: WebsiteStatus): string {
//   switch (status) {
//     case WebsiteStatus.UP:
//       return '🟢';
//     case WebsiteStatus.DOWN:
//       return '🔴';
//     case WebsiteStatus.PENDING:
//       return '⌛';
//     default:
//       return '⚪';
//   }
// }
