import { NextResponse, NextRequest } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { name, email, role, status, password } = await req.json();
        if (password) {
            const hash = await bcrypt.hash(password, 10);
            const result = await pool.query(
                'UPDATE users SET name = $1, email = $2, role = $3, status = $4, password_hash = $5 WHERE id = $6 RETURNING id, name, email, role, status',
                [name, email, role, status, hash, id]
            );
            return NextResponse.json({ user: result.rows[0] });
        } else {
            const result = await pool.query(
                'UPDATE users SET name = $1, email = $2, role = $3, status = $4 WHERE id = $5 RETURNING id, name, email, role, status',
                [name, email, role, status, id]
            );
            return NextResponse.json({ user: result.rows[0] });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
