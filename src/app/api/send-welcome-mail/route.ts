
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  auth: {
    user: 'eddiepartidadirect@gmail.com',
    pass: 'mhjwnwworkdnbrde',
  },
});

interface WelcomeMailParams {
  firstName: string;
  email: string;
  tempPassword: string;
  loginUrl?: string;
}

function getWelcomeEmailHtml({ firstName, email, tempPassword, loginUrl }: WelcomeMailParams): string {
  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f7f7fa; padding: 32px; color: #222;">
    <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #e0e0e0; padding: 32px;">
      <div style="text-align: center;">
        <img src="https://ezperfil.com/logo.png" alt="EZ Perfil Webinars" style="height: 48px; margin-bottom: 16px;" />
        <h1 style="color: #2b6cb0; font-size: 2rem; margin-bottom: 8px;">Welcome to EZ Perfil Webinars!</h1>
        <p style="font-size: 1.1rem; color: #444;">Your Access Details Inside!</p>
      </div>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
      <p>Hello <strong>${firstName}</strong>,</p>
      <p>Welcome to <strong>EZ Perfil Webinars</strong> – we're excited to have you on board!</p>
      <p>You've successfully registered and are now part of a community focused on unlocking business growth, financial strategies, and digital empowerment through our exclusive webinars.</p>
      <div style="background: #f1f5fb; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <h3 style="margin-bottom: 8px; color: #2b6cb0;">Your Login Credentials:</h3>
        <p>🔐 <strong>Login Email:</strong> <span style="color: #2b6cb0;">${email}</span></p>
        <p>🔑 <strong>Temporary Password:</strong> <span style="color: #2b6cb0;">${tempPassword}</span></p>
        <p>🌐 <strong>Login Here:</strong> <a href="${loginUrl}" style="color: #3182ce; text-decoration: underline;">${loginUrl}</a></p>
      </div>
      <h3 style="margin-top: 32px; color: #2b6cb0;">✅ Next Steps:</h3>
      <ol style="margin-left: 20px;">
        <li>Click the login link above.</li>
        <li>Enter your credentials.</li>
        <li>Update your password and complete your profile.</li>
      </ol>
      <p style="margin-top: 24px;">If you have any questions or need support, feel free to reach out to our team anytime at <a href="mailto:support@ezperfilwebinars.com" style="color: #3182ce;">support@ezperfilwebinars.com</a>.</p>
      <p style="margin-top: 32px; font-size: 1.1rem; color: #444;">Thank you for joining us — we look forward to seeing you at our next webinar!</p>
      <div style="margin-top: 32px; text-align: center; color: #888; font-size: 0.95rem;">Warm regards,<br />The EZ Perfil Webinars Team</div>
    </div>
  </div>
  `;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { firstName, email, tempPassword, loginUrl }: WelcomeMailParams = await req.json();
    if (!firstName || !email || !tempPassword) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    const finalLoginUrl = loginUrl || 'https://ezperfilwebinars.com/login';
    const mailOptions = {
      from: 'eddiepartidadirect@gmail.com',
      to: email,
      subject: 'Welcome to EZ Perfil Webinars – Your Access Details Inside!',
      html: getWelcomeEmailHtml({ firstName, email, tempPassword, loginUrl: finalLoginUrl }),
    };
    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    let errorMsg = 'Unknown error';
    if (err instanceof Error) errorMsg = err.message;
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
