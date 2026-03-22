import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vrflevqloulfkulgwmld.supabase.co';
const supabaseAnonKey = 'sb_publishable_ekc3XdU4PYrB7a6GE2Vpww_B8xBnGtD';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
