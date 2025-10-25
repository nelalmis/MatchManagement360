// src/services/emailService.ts - FIREBASE EXTENSION

import { collection, addDoc } from 'firebase/firestore';
import { db } from '../..//config/firebase.config';

export const emailService = {
    /**
     * Send verification email via Firebase Extension
     */
    async sendVerificationEmail(
        email: string,
        name: string,
        verificationLink: string
    ) {
        try {
            await addDoc(collection(db, 'mail'), {
                to: [email],
                message: {
                    subject: 'E-posta Adresinizi Doğrulayın - Maç Yönetimi ⚽',
                    html: this.getVerificationTemplate(name, email, verificationLink),
                },
            });

            console.log('✅ Verification email queued');
            return { success: true };
        } catch (error) {
            console.error('❌ Email queue error:', error);
            return { success: false, error };
        }
    },

    getVerificationTemplate(name: string, email: string, link: string) {
        return `
      <!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Doğrulama - Maç Yönetimi</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0fdf4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 50px 40px; text-align: center;">
              <!-- Logo/Icon -->
              <div style="width: 80px; height: 80px; margin: 0 auto 20px; background-color: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 48px; line-height: 1;">⚽</span>
              </div>
              <h1 style="color: #ffffff; font-size: 32px; margin: 0; font-weight: 700; letter-spacing: -0.5px;">Maç Yönetimi</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 12px 0 0 0;">Futbol Topluluğu Platformu</p>
            </td>
          </tr>
          
          <!-- Content Section -->
          <tr>
            <td style="padding: 50px 40px;">
              <!-- Welcome Title -->
              <h2 style="color: #111827; font-size: 28px; margin: 0 0 20px 0; font-weight: 700; line-height: 1.2;">
                Hoş Geldiniz! 🎉
              </h2>
              
              <!-- Intro Text -->
              <p style="color: #6b7280; font-size: 17px; line-height: 1.7; margin: 0 0 20px 0;">
                <strong style="color: #111827;">%EMAIL%</strong> adresli hesabınızı oluşturduğunuz için çok teşekkür ederiz.
              </p>
              
              <p style="color: #6b7280; font-size: 17px; line-height: 1.7; margin: 0 0 32px 0;">
                Maçlara katılmaya, takım arkadaşları bulmaya ve skor takibi yapmaya başlamak için lütfen e-posta adresinizi doğrulayın.
              </p>
              
              <!-- Verification Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0 40px 0;">
                    <a href="%LINK%" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 14px; font-size: 17px; font-weight: 700; box-shadow: 0 8px 24px rgba(22, 163, 74, 0.4); transition: transform 0.2s;">
                      E-posta Adresimi Doğrula →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Divider -->
              <div style="border-top: 2px solid #f3f4f6; margin: 32px 0;"></div>
              
              <!-- Alternative Method -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0; font-weight: 600;">
                  Buton çalışmıyor mu?
                </p>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
                  Aşağıdaki linki kopyalayıp tarayıcınıza yapıştırın:
                </p>
                <p style="color: #16a34a; font-size: 12px; line-height: 1.6; margin: 0; word-break: break-all; font-family: 'Courier New', monospace;">
                  %LINK%
                </p>
              </div>
              
              <!-- Info Box -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
                <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0;">
                  <strong>⏱️ Önemli:</strong> Bu doğrulama linki 24 saat içinde geçerliliğini yitirecektir.
                </p>
              </div>
              
              <!-- Next Steps -->
              <h3 style="color: #111827; font-size: 20px; margin: 0 0 16px 0; font-weight: 600;">
                Sonraki Adımlar
              </h3>
              
              <table cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 36px; vertical-align: top;">
                          <div style="width: 28px; height: 28px; background-color: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px;">1️⃣</div>
                        </td>
                        <td style="padding-left: 16px;">
                          <p style="color: #374151; font-size: 15px; margin: 0; line-height: 1.5;">
                            <strong>Profilinizi tamamlayın</strong><br>
                            <span style="color: #6b7280; font-size: 14px;">Fotoğraf ekleyin ve bilgilerinizi güncelleyin</span>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 36px; vertical-align: top;">
                          <div style="width: 28px; height: 28px; background-color: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px;">2️⃣</div>
                        </td>
                        <td style="padding-left: 16px;">
                          <p style="color: #374151; font-size: 15px; margin: 0; line-height: 1.5;">
                            <strong>Maçlara katılın</strong><br>
                            <span style="color: #6b7280; font-size: 14px;">Yakınınızdaki maçları keşfedin</span>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 36px; vertical-align: top;">
                          <div style="width: 28px; height: 28px; background-color: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px;">3️⃣</div>
                        </td>
                        <td style="padding-left: 16px;">
                          <p style="color: #374151; font-size: 15px; margin: 0; line-height: 1.5;">
                            <strong>Takım oluşturun</strong><br>
                            <span style="color: #6b7280; font-size: 14px;">Arkadaşlarınızı davet edin</span>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <!-- Security Note -->
              <div style="background-color: #ffffff; border-radius: 10px; padding: 20px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
                <p style="color: #374151; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">
                  🔒 Bu e-postayı siz talep etmediniz mi?
                </p>
                <p style="color: #6b7280; font-size: 13px; margin: 0; line-height: 1.5;">
                  Eğer bu hesabı siz oluşturmadıysanız, bu e-postayı güvenle görmezden gelebilirsiniz. Hiçbir işlem yapmanıza gerek yok.
                </p>
              </div>
              
              <!-- Social Links -->
              <div style="margin-bottom: 24px;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px 0;">
                  Bizi takip edin
                </p>
                <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr>
                    <td style="padding: 0 8px;">
                      <a href="https://twitter.com/yourapp" style="display: inline-block; width: 36px; height: 36px; background-color: #e5e7eb; border-radius: 50%; text-decoration: none; line-height: 36px; color: #6b7280; font-size: 18px;">𝕏</a>
                    </td>
                    <td style="padding: 0 8px;">
                      <a href="https://instagram.com/yourapp" style="display: inline-block; width: 36px; height: 36px; background-color: #e5e7eb; border-radius: 50%; text-decoration: none; line-height: 36px; color: #6b7280; font-size: 18px;">📷</a>
                    </td>
                    <td style="padding: 0 8px;">
                      <a href="https://facebook.com/yourapp" style="display: inline-block; width: 36px; height: 36px; background-color: #e5e7eb; border-radius: 50%; text-decoration: none; line-height: 36px; color: #6b7280; font-size: 18px;">f</a>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Company Info -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
                <p style="color: #9ca3af; font-size: 13px; margin: 0 0 8px 0;">
                  © 2024 Maç Yönetimi. Tüm hakları saklıdır.
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  <a href="https://yourapp.com/privacy" style="color: #16a34a; text-decoration: none;">Gizlilik Politikası</a> · 
                  <a href="https://yourapp.com/terms" style="color: #16a34a; text-decoration: none;">Kullanım Koşulları</a> · 
                  <a href="https://yourapp.com/contact" style="color: #16a34a; text-decoration: none;">İletişim</a>
                </p>
              </div>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
    },
};