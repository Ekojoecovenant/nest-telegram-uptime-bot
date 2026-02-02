import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from 'src/domain/user.entity';
import { Website } from 'src/domain/website.entity';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  username: configService.get<string>('DB_USERNAME', 'postgres'),
  password: configService.get<string>('DB_PASSWORD', ''),
  database: configService.get<string>('DB_NAME', 'postgres'),
  // entities: [__dirname + '../domain/*.entity{.ts,.js}'],
  entities: [User, Website],
  synchronize: configService.get<string>('NODE_ENV') === 'development',
  logging: ['query', 'error', 'warn'],
});
