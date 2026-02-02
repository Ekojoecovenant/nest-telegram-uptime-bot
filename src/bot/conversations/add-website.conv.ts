import { Conversation } from '@grammyjs/conversations';
import { MyContext } from '../types';

export async function addWebsiteConversation(
  conversation: Conversation,
  ctx: MyContext,
) {
  await ctx.reply(
    'Please send me the website URL to monitor.\n\n' +
      'Must start with https://',
  );

  while (true) {
    // wait for any text message (skip non-text updates)
    const { message } = await conversation.waitFor('message:text');

    const urlInput = message.text.trim();

    if (
      urlInput.toLowerCase() == '/cancel' ||
      urlInput.toLowerCase() === 'cancel'
    ) {
      await ctx.reply('Cancelled. Back to main menu.');
      return;
    }

    // Strict validation
    if (!urlInput.startsWith('https://')) {
      await ctx.reply('URL must start with https://. Try again or /cancel.');
      continue;
    }

    try {
      const url = new URL(urlInput);
      if (!url.hostname) throw new Error('Invalid hostname');

      const normalized = url.origin + url.pathname;

      // later: check if already exists for this user via DB

      await ctx.reply(`Looks good! Saving ${normalized}...`);

      // TODO: Save to DB via service
      // for now, just confirm
      await ctx.reply(
        `✅ Website added: ${normalized}\n\nStatus: ⌛ (not checked yet)`,
      );

      return; // back to main menu
    } catch (err) {
      await ctx.reply(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Invalid URL: ${err?.message ? err.message : 'Parse failed'}. Please try again or /cancel.`,
      );
      continue;
    }
  }
}
