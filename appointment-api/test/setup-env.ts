import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is missing. Copy .env.example to .env.test and point it at a dedicated test database.',
  );
}
