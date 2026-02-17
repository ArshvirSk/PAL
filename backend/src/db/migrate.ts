import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import { logger } from '../utils/logger';

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    logger.info('Starting database migrations...');

    // Read schema file
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Execute the entire schema as one transaction
    await client.query('BEGIN');
    await client.query(schema);
    await client.query('COMMIT');

    logger.info('✅ Database migrations completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error(error);
      process.exit(1);
    });
}

export default runMigrations;
