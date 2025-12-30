require('dotenv').config();
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Veritabanı bağlantısı
const db = require('./models');

const app = express();

// ===========================================
// MIDDLEWARE AYARLARI
// ===========================================

// Güvenlik middleware'leri
app.use(helmet({
    contentSecurityPolicy: false, // EJS için gerekli
    crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100, // IP başına maksimum istek
    message: 'Çok fazla istek gönderdiniz, lütfen daha sonra tekrar deneyin.'
});
app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Session ayarları
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 gün
    }
}));

// Flash mesajları
app.use(flash());

// Global değişkenler
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.session.user || null;
    res.locals.cart = req.session.cart || [];
    res.locals.siteName = process.env.SITE_NAME || 'ElectroKomponents';
    next();
});

// ===========================================
// VIEW ENGINE AYARLARI
// ===========================================

app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');

// Statik dosyalar
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ===========================================
// ROTALAR
// ===========================================

// Ana rotalar
app.use('/', require('./routes/web'));

// Auth rotaları
app.use('/auth', require('./routes/auth'));

// API rotaları
app.use('/api', require('./routes/api'));

// Admin rotaları
app.use('/admin', require('./routes/admin'));

// ===========================================
// HATA YÖNETİMİ
// ===========================================

// 404 Sayfa Bulunamadı
app.use((req, res, next) => {
    res.status(404).render('errors/404', {
        layout: 'layouts/main',
        title: 'Sayfa Bulunamadı'
    });
});

// Genel hata yakalayıcı
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('errors/500', {
        layout: 'layouts/main',
        title: 'Sunucu Hatası',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// ===========================================
// SUNUCU BAŞLATMA
// ===========================================

const PORT = process.env.PORT || 3000;

// Veritabanı senkronizasyonu ve sunucu başlatma
db.sequelize.authenticate()
    .then(() => {
        console.log('✅ MySQL veritabanına bağlandı.');
        app.listen(PORT, () => {
            console.log(`🚀 Sunucu http://localhost:${PORT} adresinde çalışıyor`);
        });
    })
    .catch(err => {
        console.error('❌ Veritabanı bağlantı hatası:', err);
    });

module.exports = app;
