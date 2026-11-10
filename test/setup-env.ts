import { config } from 'dotenv';

// Load test settings before AppModule boots so e2e tests hit bookshelf_test,
// never the development database.
config({ path: '.env.test', override: true, quiet: true });
