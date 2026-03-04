import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.zoho.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true' || true,
    auth: {
        user: process.env.SMTP_USER || 'sistemas@elcarmenhotel.com',
        pass: process.env.SMTP_PASS, // Needs to be added to .env.local
    },
});

export const sendPasswordResetEmail = async (toEmail: string, resetLink: string) => {
    const mailOptions = {
        from: `"El Carmen Hotel HR" <${process.env.SMTP_USER || 'sistemas@elcarmenhotel.com'}>`,
        to: toEmail,
        subject: 'Restablecimiento de Contraseña - El Carmen Hotel',
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #0f172a; text-align: center;">El Carmen Hotel HR</h2>
          <p style="color: #334155; font-size: 16px;">Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Restablecer Contraseña</a>
          </div>
          <p style="color: #64748b; font-size: 14px;">Este enlace expirará en 1 hora. Si no solicitaste esto, puedes ignorar este correo.</p>
        </div>
      </div>
    `,
    };

    await transporter.sendMail(mailOptions);
};
