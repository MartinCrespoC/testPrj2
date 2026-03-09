import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
        const result = await pool.query('SELECT id, name, email, role, status FROM users ORDER BY id DESC');
        return NextResponse.json({ users: result.rows });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await getCurrentUser();
    if (!user || (user as any).role === 'Viewer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    try {
        const { name, email, password, role, status } = await req.json();
        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (name, email, password_hash, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, status',
            [name, email, hash, role || 'Viewer', status || 'Active']
        );
        return NextResponse.json({ user: result.rows[0] });
    } catch (error: any) {
        if (error.code === '23505') return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
