/**
 * Authentication Middleware
 * Kullanıcı oturum kontrolü
 */

// Giriş yapılmış mı kontrol
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }

    req.flash('error_msg', 'Bu sayfayı görüntülemek için giriş yapmalısınız.');
    res.redirect('/auth/giris');
};

// Giriş yapılmamış mı kontrol (login/register sayfaları için)
const isGuest = (req, res, next) => {
    if (req.session && req.session.user) {
        return res.redirect('/hesabim');
    }
    next();
};

// Admin mi kontrol
const isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.rol === 'admin') {
        return next();
    }

    req.flash('error_msg', 'Bu sayfaya erişim yetkiniz yok.');
    res.redirect('/');
};

// Kullanıcı bilgisini res.locals'a ekle
const loadUser = (req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.isAuthenticated = !!req.session.user;
    res.locals.isAdmin = req.session.user?.rol === 'admin';
    next();
};

module.exports = {
    isAuthenticated,
    isGuest,
    isAdmin,
    loadUser
};
