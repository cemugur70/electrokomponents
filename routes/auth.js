/**
 * Auth Routes
 * Giriş, Kayıt, Şifre Sıfırlama
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { isGuest, isAuthenticated } = require('../middleware/auth');
const { User, Cart } = require('../models');
const crypto = require('crypto');

// ===========================================
// GİRİŞ SAYFASI
// ===========================================

router.get('/giris', isGuest, (req, res) => {
    res.render('auth/login', {
        title: 'Giriş Yap - ElectroKomponents',
        layout: 'layouts/auth'
    });
});

router.post('/giris', isGuest, [
    body('email').isEmail().withMessage('Geçerli bir e-posta adresi giriniz'),
    body('sifre').notEmpty().withMessage('Şifre boş olamaz')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('auth/login', {
                title: 'Giriş Yap - ElectroKomponents',
                layout: 'layouts/auth',
                errors: errors.array(),
                email: req.body.email
            });
        }

        const { email, sifre, beniHatirla } = req.body;

        // Kullanıcıyı bul
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.render('auth/login', {
                title: 'Giriş Yap - ElectroKomponents',
                layout: 'layouts/auth',
                error_msg: 'E-posta veya şifre hatalı.',
                email
            });
        }

        // Hesap durumunu kontrol et
        if (!user.durum) {
            return res.render('auth/login', {
                title: 'Giriş Yap - ElectroKomponents',
                layout: 'layouts/auth',
                error_msg: 'Hesabınız devre dışı bırakılmış.',
                email
            });
        }

        // Şifreyi kontrol et
        const isMatch = await user.sifreKarsilastir(sifre);
        if (!isMatch) {
            return res.render('auth/login', {
                title: 'Giriş Yap - ElectroKomponents',
                layout: 'layouts/auth',
                error_msg: 'E-posta veya şifre hatalı.',
                email
            });
        }

        // Session'a kullanıcıyı kaydet
        req.session.user = {
            id: user.id,
            ad: user.ad,
            soyad: user.soyad,
            email: user.email,
            rol: user.rol,
            uyelik_tipi: user.uyelik_tipi
        };

        // Beni hatırla
        if (beniHatirla) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 gün
        }

        // Session sepetini kullanıcı sepetine aktar
        if (req.session.sessionCart && req.session.sessionCart.length > 0) {
            for (const item of req.session.sessionCart) {
                const existingItem = await Cart.findOne({
                    where: { user_id: user.id, urun_id: item.urun_id }
                });

                if (existingItem) {
                    existingItem.adet += item.adet;
                    await existingItem.save();
                } else {
                    await Cart.create({
                        user_id: user.id,
                        urun_id: item.urun_id,
                        adet: item.adet
                    });
                }
            }
            delete req.session.sessionCart;
        }

        req.flash('success_msg', `Hoş geldiniz, ${user.ad}!`);

        // Redirect URL varsa oraya git
        const returnTo = req.session.returnTo || '/';
        delete req.session.returnTo;

        res.redirect(returnTo);
    } catch (error) {
        console.error('Giriş hatası:', error);
        res.render('auth/login', {
            title: 'Giriş Yap - ElectroKomponents',
            layout: 'layouts/auth',
            error_msg: 'Bir hata oluştu, lütfen tekrar deneyin.'
        });
    }
});

// ===========================================
// KAYIT SAYFASI
// ===========================================

router.get('/kayit', isGuest, (req, res) => {
    res.render('auth/register', {
        title: 'Kayıt Ol - ElectroKomponents',
        layout: 'layouts/auth'
    });
});

router.post('/kayit', isGuest, [
    body('ad').trim().isLength({ min: 2, max: 100 }).withMessage('Ad 2-100 karakter arasında olmalıdır'),
    body('soyad').trim().isLength({ min: 2, max: 100 }).withMessage('Soyad 2-100 karakter arasında olmalıdır'),
    body('email').isEmail().withMessage('Geçerli bir e-posta adresi giriniz'),
    body('telefon').optional({ checkFalsy: true }).isMobilePhone('tr-TR').withMessage('Geçerli bir telefon numarası giriniz'),
    body('sifre').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır'),
    body('sifre_tekrar').custom((value, { req }) => {
        if (value !== req.body.sifre) {
            throw new Error('Şifreler eşleşmiyor');
        }
        return true;
    }),
    body('kvkk').equals('on').withMessage('KVKK metnini kabul etmelisiniz')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('auth/register', {
                title: 'Kayıt Ol - ElectroKomponents',
                layout: 'layouts/auth',
                errors: errors.array(),
                formData: req.body
            });
        }

        const { ad, soyad, email, telefon, sifre, uyelik_tipi, firma_adi, vergi_no, vergi_dairesi } = req.body;

        // E-posta kontrolü
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.render('auth/register', {
                title: 'Kayıt Ol - ElectroKomponents',
                layout: 'layouts/auth',
                error_msg: 'Bu e-posta adresi zaten kullanılıyor.',
                formData: req.body
            });
        }

        // Doğrulama kodu oluştur
        const dogrulamaKodu = crypto.randomBytes(32).toString('hex');

        // Kullanıcıyı oluştur
        const user = await User.create({
            ad,
            soyad,
            email,
            telefon,
            sifre,
            uyelik_tipi: uyelik_tipi || 'bireysel',
            firma_adi: uyelik_tipi === 'kurumsal' ? firma_adi : null,
            vergi_no: uyelik_tipi === 'kurumsal' ? vergi_no : null,
            vergi_dairesi: uyelik_tipi === 'kurumsal' ? vergi_dairesi : null,
            dogrulama_kodu: dogrulamaKodu
        });

        // TODO: Doğrulama e-postası gönder

        req.flash('success_msg', 'Kayıt başarılı! Giriş yapabilirsiniz.');
        res.redirect('/auth/giris');
    } catch (error) {
        console.error('Kayıt hatası:', error);
        res.render('auth/register', {
            title: 'Kayıt Ol - ElectroKomponents',
            layout: 'layouts/auth',
            error_msg: 'Bir hata oluştu, lütfen tekrar deneyin.',
            formData: req.body
        });
    }
});

// ===========================================
// ÇIKIŞ
// ===========================================

router.get('/cikis', isAuthenticated, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Çıkış hatası:', err);
        }
        res.redirect('/');
    });
});

// ===========================================
// ŞİFRE SIFIRLAMA
// ===========================================

router.get('/sifremi-unuttum', isGuest, (req, res) => {
    res.render('auth/forgot-password', {
        title: 'Şifremi Unuttum - ElectroKomponents',
        layout: 'layouts/auth'
    });
});

router.post('/sifremi-unuttum', isGuest, [
    body('email').isEmail().withMessage('Geçerli bir e-posta adresi giriniz')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('auth/forgot-password', {
                title: 'Şifremi Unuttum - ElectroKomponents',
                layout: 'layouts/auth',
                errors: errors.array()
            });
        }

        const { email } = req.body;
        const user = await User.findOne({ where: { email } });

        if (user) {
            // Sıfırlama kodu oluştur
            const resetCode = crypto.randomBytes(32).toString('hex');
            user.sifre_sifirlama_kodu = resetCode;
            user.sifre_sifirlama_zamani = new Date(Date.now() + 60 * 60 * 1000); // 1 saat
            await user.save();

            // TODO: Şifre sıfırlama e-postası gönder
        }

        // Güvenlik nedeniyle her zaman başarılı mesajı göster
        req.flash('success_msg', 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
        res.redirect('/auth/giris');
    } catch (error) {
        console.error('Şifre sıfırlama hatası:', error);
        res.render('auth/forgot-password', {
            title: 'Şifremi Unuttum - ElectroKomponents',
            layout: 'layouts/auth',
            error_msg: 'Bir hata oluştu, lütfen tekrar deneyin.'
        });
    }
});

module.exports = router;
