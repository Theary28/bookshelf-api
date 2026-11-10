# Bookshelf API

A NestJS + PostgreSQL backend for keeping track of the books on my shelf and whether I've read them. Anyone can browse the shelf. Adding, editing or removing a book requires a JWT from `/auth/login`.

## Data fields (`books` table)

| Field       | Type          | Rules                                   |
| ----------- | ------------- | --------------------------------------- |
| `id`        | integer       | auto-generated primary key              |
| `title`     | string (≤200) | required, cannot be empty               |
| `author`    | string (≤120) | required, cannot be empty               |
| `isRead`    | boolean       | optional on create, defaults to `false` |
| `createdAt` | timestamp     | set by the database                     |
| `updatedAt` | timestamp     | updated on every change                 |

## Routes

| Action           | Method | URL          | Auth         |
| ---------------- | ------ | ------------ | ------------ |
| List all books   | GET    | `/books`     | public       |
| Get one book     | GET    | `/books/:id` | public       |
| Create a book    | POST   | `/books`     | Bearer token |
| Update a book    | PATCH  | `/books/:id` | Bearer token |
| Delete a book    | DELETE | `/books/:id` | Bearer token |

Auth helpers: `POST /auth/register`, `POST /auth/login` (returns `access_token`), `GET /auth/me`.

Errors: `400` for invalid bodies or non-numeric ids, `401` for a missing or invalid token, `404` for an unknown book id, `409` for an already-registered email.

## Running it

```bash
cp .env.example .env          # then fill in DB credentials and JWT_SECRET
docker compose up -d --build  # Postgres on :5434, API on :3000 (runs migrations on start)
# If my-task already holds port 3000: API_PORT=3001 docker compose up -d --build

npm install
npm run test                  # unit tests (no database needed)
npm run test:e2e              # e2e tests against the bookshelf_test database
```

To run the API outside Docker: `docker compose up -d db`, then `npm run migration:run` and `npm run start:dev`.

`docs/bookshelf.postman_collection.json` has every request from the test gallery in order. Import it into Postman or Thunder Client and set `baseUrl`.

## Test gallery

Screenshots live in `docs/screenshots/`.

| #   | Proof                                    | Screenshot                                      |
| --- | ---------------------------------------- | ----------------------------------------------- |
| 1   | List all books                           | ![](docs/screenshots/01-list.png)               |
| 2   | Get one book                             | ![](docs/screenshots/02-get-one.png)            |
| 3   | Create a book                            | ![](docs/screenshots/03-create.png)             |
| 4   | Validation error (empty title)           | ![](docs/screenshots/04-create-400.png)         |
| 5   | Update a book                            | ![](docs/screenshots/05-update.png)             |
| 6   | Delete a book                            | ![](docs/screenshots/06-delete.png)             |
| 7   | 404 for a missing book                   | ![](docs/screenshots/07-not-found.png)          |
| 8   | 401 creating without a token             | ![](docs/screenshots/08-create-401.png)         |
| 9   | Same request succeeding with a token     | ![](docs/screenshots/09-create-with-token.png)  |
| 10  | `npm run test` and `npm run test:e2e`    | ![](docs/screenshots/10-tests.png)              |

## Reflection

The hardest part was the PATCH route. My first version used `Object.assign(book, dto)`, and the response came back without the title and author. The database row was fine, which made the bug confusing. The cause was that the validated DTO keeps every optional field as an `undefined` property, which overwrote the loaded values. Filtering out the `undefined` fields fixed it, and I added unit and e2e tests that check the untouched fields survive an update. With more time I would give each user their own shelf by linking books to the logged-in user, and add filtering such as `GET /books?isRead=false` for my to-read list.
