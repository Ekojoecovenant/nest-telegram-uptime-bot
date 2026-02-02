import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from 'src/domain/entities/user.entity';
import { Website } from 'src/domain/entities/website.entity';

export const getDatabaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number.parseInt(process.env.DB_PORT!),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // autoLoadEntities: true,
  entities: [User, Website],
  synchronize: process.env.NODE_ENV === 'development',
  logging: ['error', 'warn'],
});
