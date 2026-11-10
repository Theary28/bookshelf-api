import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Book } from './book.entity.js';
import { BooksController } from './books.controller.js';
import { BooksService } from './books.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Book]), AuthModule],
  controllers: [BooksController],
  providers: [BooksService],
})
export class BooksModule {}
