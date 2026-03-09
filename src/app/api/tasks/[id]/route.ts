import { NextResponse, NextRequest } from 'next/server';
import pool from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { title, description, priority, status, assignee_id, project_id, completed } = await req.json();
        const result = await pool.query(
            `UPDATE tasks SET title = COALESCE($1, title), description = COALESCE($2, description), 
      priority = COALESCE($3, priority), status = COALESCE($4, status),
      assignee_id = COALESCE($5, assignee_id), project_id = COALESCE($6, project_id),
      completed = COALESCE($7, completed) WHERE id = $8 RETURNING *`,
            [title, description, priority, status, assignee_id, project_id, completed, id]
        );
        return NextResponse.json({ task: result.rows[0] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
