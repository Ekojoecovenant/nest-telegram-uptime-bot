import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors();

  // prefix for all routes (future)
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 3000);

  new Logger('BootStrap').log(
    'NestJS app bootstrapped - waiting for bot to start polling...',
  );
}

void bootstrap().catch((err) => {
  new Logger('BootStrap').error(`Bootstrap failed:\n${err}`);
  process.exit(1);
});
