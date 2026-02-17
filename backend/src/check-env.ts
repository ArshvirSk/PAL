import dotenv from 'dotenv';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_KEY'
];

const optionalEnvVars = [
  'GOOGLE_API_KEY',
  'REDIS_URL',
  'CHROMA_HOST',
  'JWT_SECRET'
];

export function checkEnvironment(): boolean {
  logger.info('🔍 Checking environment variables...');
  
  let allPresent = true;
  
  // Check required variables
  for (const varName of requiredEnvVars) {
    const value = process.env[varName];
    if (!value || value.startsWith('your_')) {
      logger.error(`❌ Missing or placeholder: ${varName}`);
      allPresent = false;
    } else {
      logger.info(`✅ ${varName}: configured`);
    }
  }
  
  // Check optional variables
  for (const varName of optionalEnvVars) {
    const value = process.env[varName];
    if (!value || value.startsWith('your_')) {
      logger.warn(`⚠️  Optional not set: ${varName}`);
    } else {
      logger.info(`✅ ${varName}: configured`);
    }
  }
  
  if (!allPresent) {
    logger.error('\n❌ Some required environment variables are missing!');
    logger.error('Please check your backend/.env file and update the values.');
    return false;
  }
  
  logger.info('\n✅ All required environment variables are configured!');
  return true;
}

// Run check if called directly
if (require.main === module) {
  const isValid = checkEnvironment();
  process.exit(isValid ? 0 : 1);
}
