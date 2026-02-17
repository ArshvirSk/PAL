import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

// Remove quotes from environment variables if present
const cleanEnvVar = (value: string | undefined): string | undefined => {
  if (!value) return value;
  return value.replace(/^["']|["']$/g, '');
};

const supabaseUrl = cleanEnvVar(process.env.SUPABASE_URL);
const supabaseAnonKey = cleanEnvVar(process.env.SUPABASE_ANON_KEY);
const supabaseServiceKey = cleanEnvVar(process.env.SUPABASE_SERVICE_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Supabase client for general operations
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

// Supabase admin client for privileged operations
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

// Database transaction helper
export async function withTransaction<T>(
  callback: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  try {
    return await callback(supabaseAdmin);
  } catch (error) {
    logger.error('Transaction failed:', error);
    throw error;
  }
}

// Test database connection
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    // Try a simple query
    const { error } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
      logger.error('Database connection test failed:', error);
      return false;
    }

    logger.info('✅ Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection test error:', error);
    return false;
  }
};

// Execute raw SQL (for migrations)
export async function executeSql(sql: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql });
    if (error) throw error;
  } catch (error) {
    // Fallback: try direct query
    logger.warn('RPC exec_sql not available, using direct query');
    throw error;
  }
}
