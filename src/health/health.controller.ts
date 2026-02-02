import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      // db status is optional
    };
  }

  @Get()
  root() {
    return {
      message: 'Uptime Monitor Bot API is running',
      bot: 'polling mode active',
      docs: 'Try /health for more info',
    };
  }
}
