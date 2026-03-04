import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const { id } = await context.params;
        const module = await request.json();

        const result = await client.query(
            `UPDATE training_modules SET 
         title = COALESCE($1, title), 
         description = COALESCE($2, description), 
         type = COALESCE($3, type), 
         duration = COALESCE($4, duration), 
         target_departments = COALESCE($5, target_departments), 
         required = COALESCE($6, required), 
         content_url = COALESCE($7, content_url), 
         passing_score = COALESCE($8, passing_score)
       WHERE id = $9 RETURNING *`,
            [module.title, module.description, module.type, module.duration,
            module.targetDepartments, module.required, module.contentUrl, module.passingScore, id]
        );

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ error: 'Module not found' }, { status: 404 });
        }

        // Since this is a simple update, we won't rewrite all questions here to keep it straightforward.
        // In a full implementation, you'd handle complex nested updates. 

        await client.query('COMMIT');

        return NextResponse.json({
            id: result.rows[0].id,
            title: result.rows[0].title,
            description: result.rows[0].description,
            type: result.rows[0].type,
            duration: result.rows[0].duration,
            targetDepartments: result.rows[0].target_departments,
            required: result.rows[0].required,
            contentUrl: result.rows[0].content_url,
            passingScore: result.rows[0].passing_score,
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating training module:', error);
        return NextResponse.json({ error: 'Failed to update training module' }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        // quiz_questions and user_trainings will cascade delete based on our schema
        const result = await pool.query('DELETE FROM training_modules WHERE id = $1 RETURNING id', [id]);

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Training module not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, id: result.rows[0].id });
    } catch (error) {
        console.error('Error deleting training module:', error);
        return NextResponse.json({ error: 'Failed to delete training module' }, { status: 500 });
    }
}
