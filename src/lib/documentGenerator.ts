import pool from './db';
import { calculateVacationBalance, getVacationHistory, getDurationInDays } from './vacationUtils';

/**
 * Generates a document from a template for a specific request.
 */
export async function generateDocumentForRequest(requestId: string, requestType: string, requestData: any, userData: any) {
    try {
        // 1. Fetch template for this request type
        const templateRes = await pool.query(
            'SELECT * FROM document_templates WHERE request_type = $1 LIMIT 1',
            [requestType]
        );

        if (templateRes.rows.length === 0) {
            console.log(`No document template found for request type: ${requestType}`);
            return;
        }

        const template = templateRes.rows[0];
        let content = template.content;

        // Calculate employment year if it's a vacation
        let employmentYear = 'N/A';
        if (requestType === 'Vacation' && userData.hireDate) {
            const hire = new Date(userData.hireDate);
            const start = new Date(requestData.startDate);
            const years = start.getFullYear() - hire.getFullYear();
            const anniversaryThisYear = new Date(start.getFullYear(), hire.getMonth(), hire.getDate());
            employmentYear = (start < anniversaryThisYear ? years : years + 1).toString();
        }

        // 2. Replace placeholders
        const placeholders: Record<string, string> = {
            '{{userName}}': userData.name || 'N/A',
            '{{department}}': userData.department || 'N/A',
            '{{requestType}}': requestType,
            '{{startDate}}': requestData.startDate || requestData.date || 'N/A',
            '{{endDate}}': requestData.endDate || 'N/A',
            '{{today}}': new Date().toLocaleDateString(),
            '{{requestId}}': requestId.slice(0, 8),
            '{{employmentYear}}': employmentYear,
        };

        Object.entries(placeholders).forEach(([key, value]) => {
            content = content.replace(new RegExp(key, 'g'), value);
        });

        // 3. Upsert into request_documents
        await pool.query(`
            INSERT INTO request_documents (request_id, template_id, content)
            VALUES ($1, $2, $3)
            ON CONFLICT (request_id) DO UPDATE
            SET content = EXCLUDED.content, updated_at = CURRENT_TIMESTAMP
        `, [requestId, template.id, content]);

        // 4. If it's a vacation, also trigger/update the Yearly Summary document
        if (requestType === 'Vacation') {
            await generateYearlyVacationDocument(userData.id, parseInt(employmentYear));
        }

        console.log(`Document generated successfully for request ${requestId}`);
    } catch (error) {
        console.error('Error generating document:', error);
        throw error;
    }
}

/**
 * Generates or updates a yearly summary document for a user's vacation year.
 */
export async function generateYearlyVacationDocument(userId: string, yearNumber: number) {
    try {
        const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        const user = userRes.rows[0];
        if (!user) return;

        const requestsRes = await pool.query(`
            SELECT 
                r.*, 
                COALESCE(rd.is_signed, FALSE) as is_signed
            FROM employee_requests r
            LEFT JOIN request_documents rd ON r.id = rd.request_id
            WHERE r.user_id = $1
        `, [userId]);
        
        const requests = requestsRes.rows.map(r => ({
            ...r,
            userId: r.user_id,
            requestType: r.type,
            data: r.data,
            isSigned: r.is_signed
        }));

        const history = getVacationHistory(user.hire_date, requests);
        const yearData = history.find(h => h.yearNumber === yearNumber);
        if (!yearData) return;

        const templateRes = await pool.query(
            "SELECT * FROM document_templates WHERE name ILIKE '%Yearly Vacation%' OR request_type = 'YearlyVacation' LIMIT 1"
        );
        
        if (templateRes.rows.length === 0) return;
        const template = templateRes.rows[0];
        let content = template.content;

        // Generate history table
        let tableHtml = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 0.9em;">
                <thead>
                    <tr style="background-color: #f8fafc; text-align: left;">
                        <th style="padding: 8px; border: 1px solid #e2e8f0;">Folio</th>
                        <th style="padding: 8px; border: 1px solid #e2e8f0;">Periodo / Period</th>
                        <th style="padding: 8px; border: 1px solid #e2e8f0;">Días / Days</th>
                    </tr>
                </thead>
                <tbody>
        `;

        yearData.requests.forEach(r => {
            tableHtml += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">#${r.id.slice(0, 8)}</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${r.data.startDate} - ${r.data.endDate}</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${getDurationInDays(r.data.startDate, r.data.endDate)}</td>
                </tr>
            `;
        });

        tableHtml += `
                </tbody>
                <tfoot>
                    <tr style="font-weight: bold; background-color: #f8fafc;">
                        <td colspan="2" style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">Total Tomado / Total Taken:</td>
                        <td style="padding: 8px; border: 1px solid #e2e8f0;">${yearData.taken}</td>
                    </tr>
                </tfoot>
            </table>
        `;

        const placeholders: Record<string, string> = {
            '{{userName}}': user.name,
            '{{department}}': user.department,
            '{{employmentYear}}': yearNumber.toString(),
            '{{periodRange}}': `${yearData.periodStart} - ${yearData.periodEnd}`,
            '{{accruedDays}}': yearData.accrued.toString(),
            '{{takenDays}}': yearData.taken.toString(),
            '{{remainingDays}}': yearData.remaining.toString(),
            '{{vacationHistoryTable}}': tableHtml,
            '{{today}}': new Date().toLocaleDateString(),
        };

        Object.entries(placeholders).forEach(([key, value]) => {
            content = content.replace(new RegExp(key, 'g'), value);
        });

        const yearlyRequestId = `YEARLY:${userId}:${yearNumber}`;

        await pool.query(`
            INSERT INTO request_documents (request_id, template_id, content)
            VALUES ($1, $2, $3)
            ON CONFLICT (request_id) DO UPDATE
            SET content = EXCLUDED.content, updated_at = CURRENT_TIMESTAMP
        `, [yearlyRequestId, template.id, content]);

    } catch (error) {
        console.error('Error generating yearly document:', error);
    }
}
