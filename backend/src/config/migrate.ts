import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { config } from 'dotenv';

config();

const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });

async function migrate(): Promise<void> {
  const sqlPath = path.join(__dirname, '../../migrations/init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('✅ Migración completada exitosamente');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('❌ Error en migración:', err);
  process.exit(1);
});
