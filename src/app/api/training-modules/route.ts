import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logActivity } from '@/lib/activityLogger';

export async function GET() {
    try {
        // We need to fetch the modules and their nested quiz questions
        const modulesResult = await pool.query('SELECT * FROM training_modules');
        const modules = modulesResult.rows;

        const questionsResult = await pool.query('SELECT * FROM quiz_questions');
        const questions = questionsResult.rows;

        // Map questions to their modules
        const modulesWithQuestions = modules.map(module => {
            const moduleQuestions = questions.filter(q => q.module_id === module.id).map(q => ({
                id: q.id,
                question: q.question,
                options: q.options
            }));

            return {
                id: module.id,
                title: module.title,
                description: module.description,
                type: module.type,
                duration: module.duration,
                targetDepartments: module.target_departments,
                required: module.required,
                contentUrl: module.content_url,
                passingScore: module.passing_score,
                questions: moduleQuestions.length > 0 ? moduleQuestions : undefined,
            };
        });

        return NextResponse.json(modulesWithQuestions);
    } catch (error) {
        console.error('Error fetching training modules:', error);
        return NextResponse.json({ error: 'Failed to fetch training modules' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const module = await request.json();

        // Check if the id was passed (from mock data generation)
        const id = module.id && module.id.includes('-') ? module.id : undefined;

        let moduleResult;

        if (id) {
            moduleResult = await client.query(
                `INSERT INTO training_modules 
         (id, title, description, type, duration, target_departments, required, content_url, passing_score) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
                [id, module.title, module.description, module.type, module.duration, module.targetDepartments || [],
                    module.required || false, module.contentUrl, module.passingScore]
            );
        } else {
            moduleResult = await client.query(
                `INSERT INTO training_modules 
         (title, description, type, duration, target_departments, required, content_url, passing_score) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                [module.title, module.description, module.type, module.duration, module.targetDepartments || [],
                module.required || false, module.contentUrl, module.passingScore]
            );
        }

        const newModuleId = moduleResult.rows[0].id;
        let questionsResult = [];

        // Insert questions if it's a Quiz
        if (module.type === 'Quiz' && module.questions && module.questions.length > 0) {
            for (const q of module.questions) {
                const qId = q.id && q.id.includes('-') ? q.id : undefined;
                let pResult;

                if (qId) {
                    pResult = await client.query(
                        'INSERT INTO quiz_questions (id, module_id, question, options) VALUES ($1, $2, $3, $4) RETURNING *',
                        [qId, newModuleId, q.question, JSON.stringify(q.options)]
                    );
                } else {
                    pResult = await client.query(
                        'INSERT INTO quiz_questions (module_id, question, options) VALUES ($1, $2, $3) RETURNING *',
                        [newModuleId, q.question, JSON.stringify(q.options)]
                    );
                }
                questionsResult.push({
                    id: pResult.rows[0].id,
                    question: pResult.rows[0].question,
                    options: pResult.rows[0].options,
                });
            }
        }

        await client.query('COMMIT');

        const newModule = {
            id: newModuleId,
            title: moduleResult.rows[0].title,
            description: moduleResult.rows[0].description,
            type: moduleResult.rows[0].type,
            duration: moduleResult.rows[0].duration,
            targetDepartments: moduleResult.rows[0].target_departments,
            required: moduleResult.rows[0].required,
            contentUrl: moduleResult.rows[0].content_url,
            passingScore: moduleResult.rows[0].passing_score,
            questions: questionsResult.length > 0 ? questionsResult : undefined
        };

        await logActivity(null, 'CREATE', 'TRAINING_MODULE', newModule.id, { title: newModule.title, type: newModule.type });

        return NextResponse.json(newModule);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating training module:', error);
        return NextResponse.json({ error: 'Failed to create training module' }, { status: 500 });
    } finally {
        client.release();
    }
}
