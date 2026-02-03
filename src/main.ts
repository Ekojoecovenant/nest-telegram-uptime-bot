import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors();

  // prefix for all routes (future)
  // app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;

  await app.listen(port);
  new Logger('BootStrap').log(`Bot now running on port ${port}`);
}

void bootstrap().catch((err) => {
  new Logger('BootStrap').error(`Bootstrap failed:\n${err}`);
  process.exit(1);
});
