import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  auth: {
    user: 'eddiepartidadirect@gmail.com',
    pass: 'mhjwnwworkdnbrde',
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessAge, phone, challenge, improvement, fullName, email, to } = body;

    // HTML email template with attractive design
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nueva Consulta de Negocio</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f0fdf4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #22c55e, #16a34a); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
            .header p { color: #dcfce7; margin: 10px 0 0 0; font-size: 16px; }
            .content { padding: 40px 30px; }
            .field { margin-bottom: 25px; }
            .field-label { font-weight: 600; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
            .field-value { background-color: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e; color: #1f2937; font-size: 16px; line-height: 1.5; }
            .contact-info { background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin-top: 30px; }
            .contact-info h3 { color: #166534; margin: 0 0 15px 0; font-size: 18px; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
            .icon { width: 20px; height: 20px; vertical-align: middle; margin-right: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💼 Nueva Consulta de Negocio</h1>
              <p>EZ Perfil Webinars - Formulario de Contacto</p>
            </div>
            
            <div class="content">
              <div class="field">
                <div class="field-label">👤 Nombre Completo</div>
                <div class="field-value">${fullName}</div>
              </div>
              
              <div class="field">
                <div class="field-label">📧 Correo Electrónico</div>
                <div class="field-value">${email}</div>
              </div>
              
              <div class="field">
                <div class="field-label">📞 Teléfono</div>
                <div class="field-value">${phone || 'No proporcionado'}</div>
              </div>
              
              <div class="field">
                <div class="field-label">⏰ Tiempo en el Negocio</div>
                <div class="field-value">${businessAge}</div>
              </div>
              
              <div class="field">
                <div class="field-label">🎯 Mayor Reto del Negocio</div>
                <div class="field-value">${challenge}</div>
              </div>
              
              <div class="field">
                <div class="field-label">📈 Áreas de Mejora</div>
                <div class="field-value">${improvement}</div>
              </div>
              
              <div class="contact-info">
                <h3>📋 Información del Contacto</h3>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
                <p><strong>Origen:</strong> Formulario web EZ Perfil Webinars</p>
              </div>
            </div>
            
            <div class="footer">
              <p>Este mensaje fue enviado desde el formulario de contacto de EZ Perfil Webinars</p>
              <p>© 2025 EZ Perfil Agency. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email
    await transporter.sendMail({
      from: 'eddiepartidadirect@gmail.com',
      to: to,
      subject: `🚀 Nueva consulta de negocio de ${fullName}`,
      html: htmlTemplate,
      text: `
        Nueva consulta de negocio:
        
        Nombre: ${fullName}
        Email: ${email}
        Teléfono: ${phone || 'No proporcionado'}
        Tiempo en negocio: ${businessAge}
        Mayor reto: ${challenge}
        Áreas de mejora: ${improvement}
        
        Fecha: ${new Date().toLocaleString('es-ES')}
      `,
    });

    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
