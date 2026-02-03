import { Menu, MenuRange } from '@grammyjs/menu';
import { UserWebsiteService } from 'src/user-website/user-website.service';
import { MyContext } from '../types';
import { Logger } from '@nestjs/common';
import { MonitorService } from 'src/monitor/monitor.service';
import { Website, WebsiteStatus } from 'src/domain/website.entity';

const logger = new Logger('MyWebsiteMenu');

export function createMyWebsitesMenu(
  userWebsiteService: UserWebsiteService,
  monitorService: MonitorService,
) {
  const menu = new Menu<MyContext>('my-websites-menu');

  menu.dynamic(async (ctx, range: MenuRange<MyContext>) => {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) {
      range.text('Error: Cannot identify user', () => {});
      return range;
    }

    // "Check All" button
    range
      .text('🔄️ Check All Now', async (ctx) => {
        await ctx.answerCallbackQuery({ text: 'Checking all your sites...' });

        const websites = await userWebsiteService.getUserWebsites(telegramId);

        if (websites.length === 0) {
          await ctx.reply('No websites to check yet. Add some first!');
          return;
        }

        await ctx.reply('Checking your sites... This may take a few seconds.');

        const results: Website[] = [];
        let upCount = 0;
        let downCount = 0;
        let pendingCount = 0;
        let totalTime = 0;
        let checkedCount = 0;

        for (const site of websites) {
          try {
            const updated = await monitorService.checkWebsite(site);
            results.push(updated);

            if (updated.status === WebsiteStatus.UP) {
              upCount++;
              if (updated.lastResponseTimeMs) {
                totalTime += updated.lastResponseTimeMs;
                checkedCount++;
              }
            } else if (updated.status === WebsiteStatus.DOWN) {
              downCount++;
            } else {
              pendingCount++;
            }
          } catch (err) {
            logger.error(`Check failed for ${site.url}: ${err}`);
            downCount++;
          }
        }

        const avgTime =
          checkedCount > 0 ? Math.round(totalTime / checkedCount) : 0;

        // the report
        let report = '**Uptime Report - All Sites**\n\n';
        report += `✅ ${upCount} up • ❌ ${downCount} down • ⌛ ${pendingCount} pending\n\n`;

        for (const site of results) {
          const emoji = getStatusEmoji(site.status);
          const timeStr =
            site.status === WebsiteStatus.UP && site.lastResponseTimeMs
              ? `${site.lastResponseTimeMs} ms`
              : site.status === WebsiteStatus.DOWN
                ? 'DOWN'
                : 'Pending';

          const ago = site.lastCheckedAt
            ? `(${timeAgo(site.lastCheckedAt)})`
            : '';

          report += `• ${emoji} ${site.url} - ${timeStr} ${ago}\n`;
        }

        report += `\nAverage response (up sites): ${avgTime} ms`;
        report += `\nChecked ${results.length} site${results.length === 1 ? '' : 's'}`;
        report += `\nGenerated: ${new Date().toLocaleString()}`;

        await ctx.reply(report, { parse_mode: 'Markdown' });
        await ctx.answerCallbackQuery({ text: 'Report ready!' });
      })
      .row();

    // List of individual websites
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
                      // [
                      //   {
                      //     text: '← Back to list',
                      //     callback_data: 'back-to-my-websites',
                      //   },
                      // ],
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

function getStatusEmoji(status: WebsiteStatus): string {
  switch (status) {
    case WebsiteStatus.UP:
      return '🟢';
    case WebsiteStatus.DOWN:
      return '🔴';
    case WebsiteStatus.PENDING:
      return '⌛';
    default:
      return '⚪';
  }
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  let interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + 'h ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' min ago';
  return 'just now';
}
