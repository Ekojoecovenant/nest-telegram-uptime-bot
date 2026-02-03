import { Controller, HttpStatus, Logger, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { BotService } from 'src/bot/bot.service';

@Controller('bot-webhook')
export class BotWebhookController {
  private logger = new Logger(BotWebhookController.name);

  constructor(private botService: BotService) {}

  @Post()
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    // verify secret_token if you set one
    // const secret = req.headers['x-telegram-bot-api-secret-token'];
    // if (secret != 'your-secret') return res.status(403).send('Forbidden');

    try {
      const middleware = this.botService.getWebhookMiddleware();
      await middleware(req, res);
    } catch (err) {
      this.logger.error(`Webhook error: ${err}`);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error');
    }
  }
}
