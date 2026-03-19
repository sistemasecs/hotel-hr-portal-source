import pool from './db';

/**
 * Generates a document from a template for a specific request.
 * @param requestId The ID of the request
 * @param requestType The type of the request (e.g., 'Vacation')
 * @param requestData The JSON data of the request
 * @param userData Information about the user
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

        // 2. Replace placeholders
        const placeholders: Record<string, string> = {
            '{{userName}}': userData.name || 'N/A',
            '{{department}}': userData.department || 'N/A',
            '{{requestType}}': requestType,
            '{{startDate}}': requestData.startDate || requestData.date || 'N/A',
            '{{endDate}}': requestData.endDate || 'N/A',
            '{{today}}': new Date().toLocaleDateString(),
            '{{requestId}}': requestId.slice(0, 8),
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

        console.log(`Document generated successfully for request ${requestId}`);
    } catch (error) {
        console.error('Error generating document:', error);
        throw error;
    }
}
