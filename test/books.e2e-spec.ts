import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';

describe('Books (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let token: string;

  const credentials = { email: 'reader@example.com', password: 'password123' };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    dataSource = app.get(DataSource);
    await dataSource.runMigrations();
    await dataSource.query(
      'TRUNCATE TABLE "books", "users" RESTART IDENTITY CASCADE',
    );

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(credentials)
      .expect(201);
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send(credentials)
      .expect(200);
    token = login.body.access_token;
  });

  beforeEach(async () => {
    await dataSource.query('TRUNCATE TABLE "books" RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    await app.close();
  });

  const createBook = (body: object) =>
    request(app.getHttpServer())
      .post('/books')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  it('register never returns the password hash', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'other@example.com', password: 'password123' })
      .expect(201);

    expect(response.body.email).toBe('other@example.com');
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  it('GET /books lists all books', async () => {
    await createBook({ title: 'Dune', author: 'Frank Herbert' }).expect(201);

    const response = await request(app.getHttpServer())
      .get('/books')
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({ title: 'Dune', isRead: false });
  });

  it('GET /books/:id returns one book', async () => {
    const created = await createBook({
      title: 'Dune',
      author: 'Frank Herbert',
    }).expect(201);

    const response = await request(app.getHttpServer())
      .get(`/books/${created.body.id}`)
      .expect(200);

    expect(response.body.author).toBe('Frank Herbert');
  });

  it('GET /books/:id returns 404 for a missing book', async () => {
    const response = await request(app.getHttpServer())
      .get('/books/999999')
      .expect(404);

    expect(response.body.message).toBe('Book with ID 999999 not found');
  });

  it('GET /books/:id returns 400 for a non-numeric id', async () => {
    await request(app.getHttpServer()).get('/books/abc').expect(400);
  });

  it('POST /books returns 401 without a token', async () => {
    await request(app.getHttpServer())
      .post('/books')
      .send({ title: 'Dune', author: 'Frank Herbert' })
      .expect(401);
  });

  it('POST /books creates a book with a valid token', async () => {
    const response = await createBook({
      title: 'Dune',
      author: 'Frank Herbert',
    }).expect(201);

    expect(response.body).toMatchObject({
      id: 1,
      title: 'Dune',
      author: 'Frank Herbert',
      isRead: false,
    });
  });

  it('POST /books returns 400 when a required field is empty', async () => {
    const response = await createBook({
      title: '',
      author: 'Frank Herbert',
    }).expect(400);

    expect(response.body.message).toContain('title should not be empty');
  });

  it('PATCH /books/:id marks a book as read', async () => {
    const created = await createBook({
      title: 'Dune',
      author: 'Frank Herbert',
    }).expect(201);

    const response = await request(app.getHttpServer())
      .patch(`/books/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isRead: true })
      .expect(200);

    expect(response.body).toMatchObject({
      title: 'Dune',
      author: 'Frank Herbert',
      isRead: true,
    });
  });

  it('PATCH /books/:id returns 404 for a missing book', async () => {
    await request(app.getHttpServer())
      .patch('/books/999999')
      .set('Authorization', `Bearer ${token}`)
      .send({ isRead: true })
      .expect(404);
  });

  it('DELETE /books/:id removes the book', async () => {
    const created = await createBook({
      title: 'Dune',
      author: 'Frank Herbert',
    }).expect(201);

    await request(app.getHttpServer())
      .delete(`/books/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/books/${created.body.id}`)
      .expect(404);
  });
});
