import { Injectable } from '@nestjs/common';
import { type Conversation } from '@grammyjs/conversations';
import type { MyContext } from '../types';

@Injectable()
export class AddWebsiteConversation {
  // This is the actual conversation function
  async addWebsite(conversation: Conversation<MyContext>, ctx: MyContext) {
    // 1. Ask for URL
    await ctx.reply(
      '🌐 Please send the full websites URL you want to monitor\n' +
        'Example: https://example.com or https://api.mysite.com',
    );

    // 2. Wait for user to send a text message
    const { message } = await conversation.waitFor('message:text');

    const url = message.text?.trim();

    // 3. Very basic validation (improve later)
    if (!url || !url.startsWith('http')) {
      await ctx.reply("❌ That doesn't look like a valid URL. Try again?");
      return;
    }

    // 4. Fake success (later: save to DB via service)
    await ctx.reply(
      `✅ Website added!\n\n${url}\nStatus: ⌛ Pending first check\n\n`,
    );

    // Optional: back to main menu
    // await ctx.reply('What next?', { reply_markup: ctx.menu });
  }
}
