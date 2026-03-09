import { NextResponse, NextRequest } from 'next/server';
import pool from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('project_id');

    try {
        let query = `
      SELECT t.*, u.name as assignee_name, p.name as project_name 
      FROM tasks t 
      LEFT JOIN users u ON t.assignee_id = u.id 
      LEFT JOIN projects p ON t.project_id = p.id
    `;
        const values: any[] = [];

        if (projectId) {
            query += ` WHERE t.project_id = $1`;
            values.push(projectId);
        }

        query += ` ORDER BY t.created_at DESC`;

        const result = await pool.query(query, values);
        return NextResponse.json({ tasks: result.rows });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { title, description, priority, status, project_id, assignee_id, due_date } = await req.json();
        const result = await pool.query(
            `INSERT INTO tasks (title, description, priority, status, project_id, assignee_id, due_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [title, description, priority || 'Medium', status || 'TODO', project_id, assignee_id, due_date || null]
        );
        return NextResponse.json({ task: result.rows[0] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
