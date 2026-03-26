const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envPath = path.join(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const pool = new Pool({
  connectionString: envConfig.DATABASE_URL + "?sslmode=require",
});

async function addTemplate() {
  try {
    const content = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h1 style="text-align: center; color: #1e293b; border-bottom: 2px solid #1e293b; padding-bottom: 10px;">
          CONSENTIMIENTO DE VACACIONES ANUAL / YEARLY VACATION CONSENT
        </h1>
        
        <div style="margin-top: 30px;">
          <p><strong>Empleado / Employee:</strong> {{userName}}</p>
          <p><strong>Departamento / Department:</strong> {{department}}</p>
          <p><strong>Año de Empleo / Employment Year:</strong> {{employmentYear}}</p>
          <p><strong>Periodo / Period:</strong> {{periodRange}}</p>
        </div>

        <div style="margin-top: 30px; background-color: #f8fafc; padding: 15px; border-radius: 8px;">
          <h2 style="font-size: 1.1em; color: #334155; margin-top: 0;">Resumen de Días / Days Summary</h2>
          <p>Días Acumulados / Accrued Days: <strong>{{accruedDays}}</strong></p>
          <p>Días Tomados / Taken Days: <strong>{{takenDays}}</strong></p>
          <p>Días Restantes / Remaining Days: <strong>{{remainingDays}}</strong></p>
        </div>

        <div style="margin-top: 30px;">
          <h2 style="font-size: 1.1em; color: #334155;">Detalle de Vacaciones / Vacation Detail</h2>
          {{vacationHistoryTable}}
        </div>

        <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; pt-20px;">
          <p style="font-size: 0.9em; color: #64748b;">
            Este documento resume todas las vacaciones tomadas durante el año de empleo indicado. 
            Al firmar digitalmente, el empleado confirma su conformidad con los días registrados.
          </p>
          <p style="font-size: 0.8em; color: #94a3b8;">Generado el / Generated on: {{today}}</p>
        </div>
      </div>
    `;

    await pool.query(`
      INSERT INTO document_templates (name, request_type, content)
      VALUES ($1, $2, $3)
    `, ['Yearly Vacation Consent', 'YearlyVacation', content]);

    console.log('Yearly Vacation Consent template added successfully.');
  } catch (err) {
    console.error('Error adding template:', err);
  } finally {
    await pool.end();
  }
}

addTemplate();
