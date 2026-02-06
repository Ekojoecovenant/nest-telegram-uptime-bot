import { Menu } from '@grammyjs/menu';
import { MyContext } from '../types';

export const mainMenu: Menu<MyContext> = new Menu<MyContext>('main-menu')
  .text('➕ Add Website', async (ctx) => {
    await ctx.conversation.enter('add-website');
  })
  .row()
  .text('📋 My Websites', (ctx) => ctx.menu.nav('my-websites-menu'))
  .row()
  .text('ℹ️ Help', async (ctx) => {
    await ctx.reply(
      'Uptime Monitor Bot\n\n' +
        '• Add websites to monitor\n' +
        '• Get instant status checks\n' +
        '• (Future: periodic alerts)',
    );
  });
