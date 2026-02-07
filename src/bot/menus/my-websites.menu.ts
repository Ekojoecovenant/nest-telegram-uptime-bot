import { Menu, MenuRange } from '@grammyjs/menu';
import { UserWebsiteService } from 'src/user-website/user-website.service';
import { MyContext } from '../types';
import { Logger } from '@nestjs/common';
import { MonitorService } from 'src/monitor/monitor.service';
import { Website, WebsiteStatus } from 'src/domain/website.entity';
import { getStatusEmoji, timeAgo } from 'src/utils/func.utils';
import { InlineKeyboard } from 'grammy';

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

    // ============ "Check All Now" ==============
    range
      .text('🔄️ Check All Now', async (ctx) => {
        await ctx.answerCallbackQuery();
        const websites = await userWebsiteService.getUserWebsites(telegramId);

        if (websites.length === 0) {
          await ctx.reply('No websites to check yet. Add some first!');
          return;
        }

        await ctx.reply('Checking your sites... This may take a few seconds.');

        const results: Website[] = [];
        let upCount = 0,
          downCount = 0,
          pendingCount = 0;
        let totalTime = 0,
          checkedCount = 0;

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
                ? `DOWN${site.lastErrorReason ? ` (${site.lastErrorReason})` : ''}`
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
      })
      .row();

    // ============== List of individual  ================
    try {
      const websites = await userWebsiteService.getUserWebsites(telegramId);

      if (websites.length === 0) {
        range
          .text('No websites yet', async (ctx) => {
            const emptyText = `📋 **My Websites**\n\nYou don't have any websites added yet.\nAdd one to start monitoring!`;

            const keyboard = new InlineKeyboard()
              .text(`➕ Add Website`, 'add-website')
              .row()
              .text('← Main Menu', 'back-to-main-menu');

            await ctx.editMessageText(emptyText, {
              parse_mode: 'Markdown',
              reply_markup: keyboard,
            });
          })
          .row();
      } else {
        websites.forEach((site) => {
          const emoji = getStatusEmoji(site.status);
          const shortUrl =
            site.url.length > 35 ? site.url.slice(0, 32) + '...' : site.url;

          range
            .text(`${emoji} ${shortUrl}`, async (ctx) => {
              const detailText =
                `🌐 **${site.url}**\n\n` +
                `Status: ${emoji} ${site.status.toUpperCase()}${site.lastErrorReason ? ` (${site.lastErrorReason})` : ''}\n` +
                `Last check: ${timeAgo(site.lastCheckedAt)}\n` +
                `Response time: ${site.lastResponseTimeMs ? site.lastResponseTimeMs + ' ms' : 'N/A'}`;

              const keyboard = {
                inline_keyboard: [
                  [{ text: '🔄️ Check Now', callback_data: `check:${site.id}` }],
                  [
                    {
                      text: '🗑️ Delete',
                      callback_data: `confirm-delete:${site.id}`,
                    },
                  ],
                  [
                    {
                      text: '← Back to list',
                      callback_data: 'back-to-my-websites',
                    },
                  ],
                  [
                    {
                      text: '🔰 Main Menu',
                      callback_data: 'back-to-main-menu',
                    },
                  ],
                ],
              };

              await ctx.editMessageText(detailText, {
                parse_mode: 'Markdown',
                reply_markup: keyboard,
              });
            })
            .row();
        });
      }
    } catch (err) {
      logger.error(`Error loading websites in menu: ${err}`);
      range.text('Error loading list', () => {}).row();
    }

    range.row().back('← Main Menu');

    return range;
  });

  return menu;
}
