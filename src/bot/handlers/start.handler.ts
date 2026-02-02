import { Injectable } from '@nestjs/common';
import { MyContext } from '../types';

@Injectable()
export class StartHandler {
  async handle(ctx: MyContext) {
    // for now just placeholder - menu is registered in bot.service
    await ctx.reply('Use /start or the menu buttons.');
  }
}
