import { Menu } from '@grammyjs/menu';
import { MyContext } from '../types';

export const mainMenu: Menu<MyContext> = new Menu<MyContext>('main-menu')
  .text('➕ Add Website', async (ctx) => {
    await ctx.conversation.enter('add-website');
  })
  .row()
  .text('📋 My Websites', async (ctx) => {
    await ctx.reply('Your websites list coming soon...');
  })
  .row()
  .text('ℹ️ Help', async (ctx) => {
    await ctx.reply(
      'Uptime Monitor Bot\n\n' +
        '• Add websites to monitor\n' +
        '• Get instant status checks\n' +
        '• (Future: periodic alerts)',
    );
  });

// dynamic label (shows count later)
// mainMenu.dynamic(async (ctx, range) => {
//   // Example: if we had session/user data
//   // range.text(`Websites: ${ctx.session?.websites?.length ?? 0}`);
// });
