import { Conversation } from '@grammyjs/conversations';
import { MyContext } from '../types';
import { UserWebsiteService } from 'src/user-website/user-website.service';
import { WebsiteStatus } from 'src/domain/website.entity';

export async function addWebsiteConversation(
  conversation: Conversation,
  ctx: MyContext,
  userWebsiteService: UserWebsiteService,
) {
  await ctx.reply(
    'Please send me the website URL to monitor.\n\n' +
      'Must start with https://',
  );

  while (true) {
    // wait for any text message (skip non-text updates)
    const { message } = await conversation.waitFor('message:text');
    const urlInput = message.text.trim();

    if (['/cancel', 'cancel'].includes(urlInput.toLowerCase())) {
      await ctx.reply('Cancelled.');
      return;
    }

    // Strict validation
    if (!urlInput.startsWith('https://')) {
      await ctx.reply('URL must start with https://. Try again or /cancel.');
      continue;
    }

    try {
      const url = new URL(urlInput);
      if (url.protocol !== 'https:' || !url.hostname)
        throw new Error('Invalid HTTPS URL or missing hostname');

      const normalized = url.origin + (url.pathname || '/');
      await ctx.reply(`Valid! Saving ${normalized}...`);

      const website = await userWebsiteService.addWebsiteForUser(
        ctx.from!.id.toString(),
        normalized,
      );

      await ctx.reply(
        `✅ Website added: ${website.url}\nStatus: ${getStatusEmoji(website.status)}`,
      );

      return;
    } catch {
      await ctx.reply(`Invalid URL. Try again or /cancel.`);
    }
  }
}

export function getStatusEmoji(status: WebsiteStatus): string {
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
