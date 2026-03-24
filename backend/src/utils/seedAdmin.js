import bcrypt from 'bcrypt';
import fs from 'fs';
import { supabase } from '../config/supabase.js';

const ADMIN_EMAIL = 'admin@teamlogger.com';
const ADMIN_NAME = 'Admin';
const DEFAULT_PASSWORD = 'admin123';

function maskKey(key) {
  if (!key) return 'N/A';
  const start = key.slice(0, 6);
  const end = key.slice(-4);
  return `${start}...${end}`;
}

async function main() {
  try {
    const logFile = 'seedAdmin.log';
    const origLog = console.log;
    const origErr = console.error;
    const write = (prefix, args) => {
      const line = args
        .map((a) => (typeof a === 'string' ? a : (() => { try { return JSON.stringify(a); } catch { return String(a); } })()))
        .join(' ');
      fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${prefix} ${line}\n`);
    };
    console.log = (...args) => { origLog(...args); write('INFO', args); };
    console.error = (...args) => { origErr(...args); write('ERROR', args); };

    console.log('Seeder: Supabase URL:', process.env.SUPABASE_URL || 'MISSING');
    console.log(
      'Seeder: Service key detected:',
      process.env.SUPABASE_SERVICE_ROLE_KEY ? 'YES' : 'NO'
    );
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('Seeder: Service key (masked):', maskKey(process.env.SUPABASE_SERVICE_ROLE_KEY));
    }

    console.log('Seeder: Testing connection with a simple select...');
    const { data: pingData, error: pingError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    if (pingError) {
      console.error('Seeder: Connection test failed:', pingError);
    } else {
      console.log('Seeder: Connection test OK. Rows preview:', Array.isArray(pingData) ? pingData.length : 0);
    }

    console.log('Seeder: Checking if admin exists...');
    const { data: existing, error: selectError } = await supabase
      .from('users')
      .select('id')
      .eq('email', ADMIN_EMAIL)
      .limit(1)
      .maybeSingle();

    if (selectError) {
      console.error('Error checking admin:', selectError);
      throw new Error(selectError.message || 'Select failed');
    }

    if (existing) {
      console.log('Admin already exists');
      process.exit(0);
    }

    console.log('Seeder: Hashing password...');
    const password_hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    console.log('Seeder: Inserting admin user...');
    const { data: inserted, error: insertError } = await supabase
      .from('users')
      .insert({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        role: 'admin',
        password_hash
      })
      .select('id,email,role')
      .single();

    console.log('Seeder: Insert response data:', inserted || null);
    if (insertError) {
      console.error('Seeder: Insert error:', insertError);
      throw new Error(insertError.message || 'Insert failed');
    }

    if (!inserted) {
      throw new Error('Insert returned no data');
    }

    console.log('Admin user created successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err?.message || err);
    process.exit(1);
  }
}

main();
