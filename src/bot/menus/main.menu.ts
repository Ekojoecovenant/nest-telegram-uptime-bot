import { Menu } from '@grammyjs/menu';
import { MyContext } from '../types';
import { UserWebsiteService } from 'src/user-website/user-website.service';

export function createMainMenu(
  userWebsiteService: UserWebsiteService,
): Menu<MyContext> {
  const menu = new Menu<MyContext>('main-menu')
    .text('➕ Add Website', async (ctx) => {
      await ctx.answerCallbackQuery();
      await ctx.conversation.enter('add-website');
    })
    .row()
    .text('📋 My Websites', async (ctx) => {
      await ctx.answerCallbackQuery();

      const telegramId = ctx.from?.id.toString();
      if (!telegramId) {
        await ctx.editMessageText('Error: Could not identify you 🤨');
        return;
      }

      const websites = await userWebsiteService.getUserWebsites(telegramId); //replace with real fetch

      let text = `📋 Your Websites\n\n`;
      if (websites.length === 0) {
        text += `You're not monitoring any websites yet.\nTap "Add Website" to start!`;
      } else {
        text += websites
          .map((site) => {
            let statusEmoji = '⌛';
            if (site.status === 'up') statusEmoji = '🟢';
            if (site.status === 'down') statusEmoji = '🔴';

            return `${statusEmoji} ${site.url}\n    Last Check: ${site.lastCheckedAt ? site.lastCheckedAt.toLocaleDateString() : 'never'}\n`;
          })
          .join('\n');
      }

      await ctx.editMessageText(text, {
        reply_markup: createMainMenu(userWebsiteService), // recursive for back-navigation
      });
    })
    .row()
    .text('ℹ️ Help', async (ctx) => {
      await ctx.answerCallbackQuery();
      await ctx.editMessageText(
        'Monitor websites * Alerts on down/up * 1 min checks',
        { reply_markup: createMainMenu(userWebsiteService) },
      );
    });

  return menu;
}
