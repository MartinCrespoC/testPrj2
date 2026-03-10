import { NextResponse, NextRequest } from 'next/server';
import pool from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const result = await pool.query("SELECT * FROM settings WHERE key = 'chatbot_system_instruction'");
    if (result.rows.length > 0) {
      return NextResponse.json({ setting: result.rows[0] });
    }
    return NextResponse.json({ setting: { value: '' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { system_instruction } = await req.json();
    const result = await pool.query(
      `INSERT INTO settings (key, value, updated_at) 
       VALUES ('chatbot_system_instruction', $1, CURRENT_TIMESTAMP) 
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP RETURNING *`,
      [system_instruction]
    );
    return NextResponse.json({ setting: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
