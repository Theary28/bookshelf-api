import 'dotenv/config';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataSource } from 'typeorm';

// Resolves to src/ under ts-node and to dist/ in Docker. Forward slashes keep
// TypeORM's globs working on Windows.
const baseDir = dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/');
const ext = import.meta.url.endsWith('.ts') ? 'ts' : 'js';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [`${baseDir}/**/*.entity.${ext}`],
  migrations: [`${baseDir}/migrations/*.${ext}`],
  synchronize: false,
});
