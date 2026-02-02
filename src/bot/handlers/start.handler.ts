import { Injectable } from '@nestjs/common';
import { Context } from 'grammy';

@Injectable()
export class StartHandler {
  async handle(ctx: Context) {
    // for now just placeholder - menu is registered in bot.service
    await ctx.reply('Use /start or the menu buttons.');
  }
}
