import { Menu } from '@grammyjs/menu';
import { MyContext } from '../types';

export function createMainMenu(): Menu<MyContext> {
  return new Menu<MyContext>('main-menu')
    .text('➕ Add Website', async (ctx) => {
      await ctx.answerCallbackQuery();
      await ctx.conversation.enter('add-website');
    })
    .row()
    .text('📋 My Websites', async (ctx) => {
      await ctx.answerCallbackQuery();
      await ctx.editMessageText('No websites added yet.', {
        reply_markup: createMainMenu(), // keep menu
      });
    })
    .row()
    .text('ℹ️ Help', async (ctx) => {
      await ctx.answerCallbackQuery();
      await ctx.editMessageText(
        'Monitor websites * Alerts on down/up * 1 min checks',
        { reply_markup: createMainMenu() },
      );
    });
}
