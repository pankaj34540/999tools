// ============================================
// EMAIL SENDER API — Resend Integration
// ============================================
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { toEmail, operatorName, centerName, loginEmail, loginPassword, portalType } = req.body;

  if (!toEmail || !loginEmail || !loginPassword) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const portalName = portalType === 'esuvidha' ? 'E SUVIDHA' : '999tools VLE';
    const portalUrl = portalType === 'esuvidha' ? 'https://tools999.store/e-suvidha' : 'https://tools999.store';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">${portalName}</h1>
          <p style="color: #c7d2fe; margin: 8px 0 0; font-size: 14px;">Your Login Credentials</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0;">
          <p style="color: #334155; font-size: 16px;">Namaste <strong>${operatorName}</strong>,</p>
          <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
            Aapka <strong>${centerName}</strong> ka ${portalName} account successfully create ho gaya hai.
          </p>
          
          <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <p style="margin: 0 0 12px; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Your Login Credentials</p>
            <p style="margin: 8px 0; color: #0f172a;"><strong>Login URL:</strong> <a href="${portalUrl}" style="color: #3b82f6;">${portalUrl}</a></p>
            <p style="margin: 8px 0; color: #0f172a;"><strong>Email:</strong> ${loginEmail}</p>
            <p style="margin: 8px 0; color: #0f172a;"><strong>Password:</strong> <code style="background: #e2e8f0; padding: 2px 8px; border-radius: 4px; font-size: 14px;">${loginPassword}</code></p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${portalUrl}" style="background: #3b82f6; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block;">
              Login to ${portalName} →
            </a>
          </div>
          
          <p style="color: #ef4444; font-size: 12px; text-align: center; margin-top: 20px;">
            ⚠️ Ye password kisi ke saath share mat karein. Immediately login karke change kar lein.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
            Any problems? Contact us: pdas966846@gmail.com<br>
            © 2026 ${portalName} · All rights reserved
          </p>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: '999tools <onboarding@resend.dev>',  // Jab domain verify karenge tab apna domain use karenge
      to: toEmail,
      subject: `🎉 Welcome to ${portalName} — Your Login Credentials`,
      html: htmlContent,
    });

    return res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (err) {
    console.error('Email send error:', err);
    return res.status(500).json({ error: err.message || 'Failed to send email' });
  }
}
