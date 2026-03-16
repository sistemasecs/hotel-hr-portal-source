import pool from './db';

export type ActivityAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'SIGN';
export type EntityType = 'USER' | 'DEPARTMENT' | 'EVENT' | 'EVENT_TYPE' | 'TRAINING_MODULE' | 'REQUEST' | 'CELEBRATION_PHOTO' | 'GAMIFICATION' | 'CONFIG' | 'SHIFT' | 'SHIFT_APPROVAL' | 'ATTENDANCE_LOG' | 'SHIFT_TYPE' | 'VACATION_CONSENT';

export async function logActivity(
    userId: string | null,
    action: ActivityAction,
    entityType: EntityType,
    entityId: string | null,
    details: any = null
) {
    try {
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
            [userId, action, entityType, entityId, details ? JSON.stringify(details) : null]
        );
    } catch (error) {
        console.error('Failed to log activity:', error);
        // We don't want to throw here because activity logging shouldn't break the main operation
    }
}
