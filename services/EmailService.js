/**
 * Email Service
 * E-posta gönderimi servisi
 */

const nodemailer = require('nodemailer');

// SMTP transporter oluştur
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

class EmailService {
    /**
     * E-posta gönder
     * @param {Object} options - E-posta seçenekleri
     * @returns {Promise<Object>} Gönderim sonucu
     */
    static async send(options) {
        const mailOptions = {
            from: `"ElectroKomponents" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text
        };

        return transporter.sendMail(mailOptions);
    }

    /**
     * Hoş geldiniz e-postası
     * @param {Object} kullanici - Kullanıcı bilgileri
     */
    static async sendWelcome(kullanici) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Segoe UI', sans-serif; background: #f4f4f4; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
                    .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; }
                    .logo { font-size: 24px; font-weight: bold; }
                    .content { padding: 30px; }
                    h1 { color: #1e293b; margin-bottom: 20px; }
                    p { color: #64748b; line-height: 1.6; }
                    .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                    .footer { background: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">ElectroKomponents</div>
                    </div>
                    <div class="content">
                        <h1>Hoş Geldiniz, ${kullanici.ad}!</h1>
                        <p>ElectroKomponents ailesine katıldığınız için teşekkür ederiz.</p>
                        <p>50.000'den fazla elektronik komponent, hızlı teslimat ve teknik destek ile projelerinize güç katmaya hazırız.</p>
                        <a href="${process.env.SITE_URL}/urunler" class="btn">Alışverişe Başla</a>
                    </div>
                    <div class="footer">
                        <p>© 2024 ElectroKomponents. Tüm hakları saklıdır.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.send({
            to: kullanici.email,
            subject: 'ElectroKomponents\'e Hoş Geldiniz!',
            html
        });
    }

    /**
     * Şifre sıfırlama e-postası
     * @param {Object} kullanici - Kullanıcı bilgileri
     * @param {string} resetToken - Sıfırlama token'ı
     */
    static async sendPasswordReset(kullanici, resetToken) {
        const resetUrl = `${process.env.SITE_URL}/auth/sifre-sifirla/${resetToken}`;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Segoe UI', sans-serif; background: #f4f4f4; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
                    .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; }
                    .logo { font-size: 24px; font-weight: bold; }
                    .content { padding: 30px; }
                    h1 { color: #1e293b; margin-bottom: 20px; }
                    p { color: #64748b; line-height: 1.6; }
                    .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                    .warning { background: #fef3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 6px; margin-top: 20px; color: #856404; }
                    .footer { background: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">ElectroKomponents</div>
                    </div>
                    <div class="content">
                        <h1>Şifre Sıfırlama</h1>
                        <p>Merhaba ${kullanici.ad},</p>
                        <p>Hesabınız için şifre sıfırlama talebinde bulundunuz. Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
                        <a href="${resetUrl}" class="btn">Şifremi Sıfırla</a>
                        <div class="warning">
                            <strong>Uyarı:</strong> Bu link 1 saat geçerlidir. Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
                        </div>
                    </div>
                    <div class="footer">
                        <p>© 2024 ElectroKomponents. Tüm hakları saklıdır.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.send({
            to: kullanici.email,
            subject: 'Şifre Sıfırlama - ElectroKomponents',
            html
        });
    }

    /**
     * Sipariş onay e-postası
     * @param {Object} siparis - Sipariş bilgileri (ilişkiler dahil)
     */
    static async sendOrderConfirmation(siparis) {
        const urunlerHtml = siparis.urunler.map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e5e5;">${item.urun_adi}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e5e5;">${item.adet}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e5e5;">${parseFloat(item.birim_fiyat).toFixed(2)} ₺</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e5e5;">${parseFloat(item.toplam_fiyat).toFixed(2)} ₺</td>
            </tr>
        `).join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Segoe UI', sans-serif; background: #f4f4f4; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
                    .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; }
                    .logo { font-size: 24px; font-weight: bold; }
                    .content { padding: 30px; }
                    h1 { color: #1e293b; margin-bottom: 20px; }
                    p { color: #64748b; line-height: 1.6; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th { background: #f8fafc; text-align: left; padding: 10px; }
                    .total { font-size: 18px; font-weight: bold; color: #1e293b; text-align: right; margin-top: 20px; }
                    .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                    .footer { background: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">✓ Siparişiniz Alındı!</div>
                    </div>
                    <div class="content">
                        <h1>Sipariş Onayı</h1>
                        <p>Merhaba ${siparis.kullanici.ad},</p>
                        <p>Siparişiniz başarıyla oluşturuldu. Sipariş detaylarınız aşağıdadır:</p>
                        
                        <p><strong>Sipariş No:</strong> #${siparis.siparis_no}</p>
                        <p><strong>Sipariş Tarihi:</strong> ${new Date(siparis.created_at).toLocaleDateString('tr-TR')}</p>
                        
                        <table>
                            <thead>
                                <tr>
                                    <th>Ürün</th>
                                    <th>Adet</th>
                                    <th>Birim Fiyat</th>
                                    <th>Toplam</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${urunlerHtml}
                            </tbody>
                        </table>
                        
                        <div class="total">
                            Genel Toplam: ${parseFloat(siparis.toplam_tutar).toFixed(2)} ₺
                        </div>
                        
                        <a href="${process.env.SITE_URL}/siparislerim/${siparis.id}" class="btn">Siparişi Görüntüle</a>
                    </div>
                    <div class="footer">
                        <p>© 2024 ElectroKomponents. Tüm hakları saklıdır.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.send({
            to: siparis.kullanici.email,
            subject: `Sipariş Onayı #${siparis.siparis_no} - ElectroKomponents`,
            html
        });
    }

    /**
     * Kargo bildirim e-postası
     * @param {Object} siparis - Sipariş bilgileri
     */
    static async sendShippingNotification(siparis) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Segoe UI', sans-serif; background: #f4f4f4; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
                    .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; }
                    .logo { font-size: 24px; font-weight: bold; }
                    .content { padding: 30px; }
                    h1 { color: #1e293b; margin-bottom: 20px; }
                    p { color: #64748b; line-height: 1.6; }
                    .tracking-box { background: #fef3cd; border: 1px solid #ffc107; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; }
                    .tracking-number { font-size: 24px; font-weight: bold; color: #1e293b; letter-spacing: 2px; }
                    .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                    .footer { background: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">📦 Siparişiniz Kargoya Verildi!</div>
                    </div>
                    <div class="content">
                        <h1>Kargo Bilgileri</h1>
                        <p>Merhaba ${siparis.kullanici.ad},</p>
                        <p>#${siparis.siparis_no} numaralı siparişiniz kargoya verildi!</p>
                        
                        <div class="tracking-box">
                            <p><strong>Kargo Firması:</strong> ${siparis.kargo_firmasi || 'Yurtiçi Kargo'}</p>
                            <p><strong>Takip Numarası:</strong></p>
                            <div class="tracking-number">${siparis.kargo_takip_no}</div>
                        </div>
                        
                        <a href="${process.env.SITE_URL}/siparis-takibi?takip=${siparis.kargo_takip_no}" class="btn">Kargoyu Takip Et</a>
                    </div>
                    <div class="footer">
                        <p>© 2024 ElectroKomponents. Tüm hakları saklıdır.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.send({
            to: siparis.kullanici.email,
            subject: `Siparişiniz Kargoya Verildi #${siparis.siparis_no} - ElectroKomponents`,
            html
        });
    }
}

module.exports = EmailService;
