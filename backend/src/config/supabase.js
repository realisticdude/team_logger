import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (url) {
  console.log('SUPABASE_URL is defined');
} else {
  console.log('SUPABASE_URL is missing');
}
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('SUPABASE_SERVICE_ROLE_KEY is defined');
} else {
  console.log('SUPABASE_SERVICE_ROLE_KEY is missing');
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});
