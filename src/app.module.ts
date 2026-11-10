import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { BooksModule } from './books/books.module.js';
import { CreateUsersTable1794300000000 } from './migrations/1794300000000-CreateUsersTable.js';
import { CreateBooksTable1794300000001 } from './migrations/1794300000001-CreateBooksTable.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT')),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: false,
        // Listed so the e2e suite can build its schema with runMigrations().
        migrations: [
          CreateUsersTable1794300000000,
          CreateBooksTable1794300000001,
        ],
      }),
    }),
    AuthModule,
    BooksModule,
  ],
})
export class AppModule {}
