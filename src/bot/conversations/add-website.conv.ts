import { Injectable } from '@nestjs/common';
import { type Conversation } from '@grammyjs/conversations';
import type { MyContext } from '../types';
import { UserWebsiteService } from 'src/user-website/user-website.service';
import { createMainMenu } from '../menus/main.menu';

@Injectable()
export class AddWebsiteConversation {
  constructor(private userWebsiteService: UserWebsiteService) {}

  // This is the actual conversation function
  async addWebsite(conversation: Conversation<MyContext>, ctx: MyContext) {
    // keep asking for URL until we get a valid URL or user cancels somehow
    while (true) {
      await ctx.reply(
        '🌐 Please send the full websites URL you want to monitor\n' +
          'Examples:\n• https://example.com\n• https://api.mysite.com',
      );

      // Wait for user to send a text message
      const { message } = await conversation.waitFor('message:text');
      const input = message.text?.trim();

      // Very basic validation (improve later)
      if (!input) {
        await ctx.reply('❌ No URL received. Please try again.');
        continue;
      }

      if (input.length > 2000) {
        await ctx.reply('❌ URL is too long. Pease send a shorter one.');
        continue;
      }

      // ======= Stricter validation =======

      // 1. Must start with http:// or https://
      if (!input.match(/^https?:\/\//i)) {
        await ctx.reply(
          '❌ URL must start with http:// or https://\n.' +
            'Please include the protocol and try again.',
        );
        continue;
      }

      // 2. Try to parse as real URL (catches most malformed cases)
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(input);
      } catch (err) {
        void err;
        await ctx.reply(
          '❌ Invalid URL format.\n' +
            'Make sure it looks like https://example.com/path (optional path)',
        );
        continue;
      }

      // 3. Additional checks on parsed URL
      if (!parsedUrl.hostname) {
        await ctx.reply('❌ No valid hostname found in the URL');
        continue;
      }

      // Optional: block localhost/private IPs for production (uncomment later)
      if (
        parsedUrl.hostname === 'localhost' ||
        parsedUrl.hostname.startsWith('127.')
      ) {
        await ctx.reply(
          '❌ Localhost/private IPs are not allowed for monitoring.',
        );
        continue;
      }

      // Clean up the url a bit (normalize)
      const cleanUrl = parsedUrl.origin + parsedUrl.pathname + parsedUrl.search;

      // Save it!
      const savedWebsite = await this.userWebsiteService.addWebsite(
        ctx.from!.id.toString(),
        cleanUrl,
      );

      // Success!
      await ctx.reply(
        `✅ Looks good!\n\n` +
          `URL: ${savedWebsite.url}\n` +
          `ID: ${savedWebsite.id}\n` +
          `Status: ⌛ Pending first check`,
      );

      break;
    }

    // After success, show main menu again (nice touch)
    await ctx.reply('What would you like to do next?', {
      reply_markup: createMainMenu(this.userWebsiteService), // assuming main menu is available via ctx.menu
    });
  }
}
