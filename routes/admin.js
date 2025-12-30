/**
 * Admin Routes
 * Admin panel rotaları
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { uploadSingle, uploadMultiple } = require('../middleware/upload');
const { body, validationResult } = require('express-validator');
const {
    User, Product, Category, Brand, Order, OrderItem,
    ProductImage, ProductAttribute, ProductPriceTier, Slider, Setting
} = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../models').sequelize;

// Tüm admin rotaları için middleware'ler
router.use(isAuthenticated, isAdmin);

// Admin layout kullan
router.use((req, res, next) => {
    res.locals.layout = 'admin/layouts/admin';
    next();
});

// ===========================================
// DASHBOARD
// ===========================================

router.get('/', async (req, res) => {
    try {
        const bugun = new Date();
        bugun.setHours(0, 0, 0, 0);

        // İstatistikler
        const [
            bugunkuSiparisler,
            toplamSiparis,
            toplamMusteri,
            stokUyarisi
        ] = await Promise.all([
            Order.count({ where: { created_at: { [Op.gte]: bugun } } }),
            Order.count(),
            User.count({ where: { rol: 'musteri' } }),
            Product.count({ where: { stok: { [Op.lt]: 10 }, durum: 1 } })
        ]);

        // Bugünkü satış tutarı
        const bugunkuSatis = await Order.sum('toplam_tutar', {
            where: {
                created_at: { [Op.gte]: bugun },
                odeme_durumu: 'odendi'
            }
        }) || 0;

        // Son siparişler
        const sonSiparisler = await Order.findAll({
            include: [{ model: User, as: 'kullanici', attributes: ['ad', 'soyad', 'email'] }],
            order: [['created_at', 'DESC']],
            limit: 10
        });

        // Son 7 günlük satış grafiği
        const yediGunOnce = new Date();
        yediGunOnce.setDate(yediGunOnce.getDate() - 7);

        const gunlukSatislar = await Order.findAll({
            attributes: [
                [sequelize.fn('DATE', sequelize.col('created_at')), 'tarih'],
                [sequelize.fn('SUM', sequelize.col('toplam_tutar')), 'toplam'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'adet']
            ],
            where: {
                created_at: { [Op.gte]: yediGunOnce },
                odeme_durumu: 'odendi'
            },
            group: [sequelize.fn('DATE', sequelize.col('created_at'))],
            order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
        });

        res.render('admin/dashboard', {
            title: 'Dashboard - Admin Panel',
            stats: {
                bugunkuSiparisler,
                bugunkuSatis,
                toplamSiparis,
                toplamMusteri,
                stokUyarisi
            },
            sonSiparisler,
            gunlukSatislar
        });
    } catch (error) {
        console.error('Dashboard hatası:', error);
        req.flash('error_msg', 'Veriler yüklenirken bir hata oluştu.');
        res.render('admin/dashboard', {
            title: 'Dashboard - Admin Panel',
            stats: {},
            sonSiparisler: [],
            gunlukSatislar: []
        });
    }
});

// ===========================================
// ÜRÜN YÖNETİMİ
// ===========================================

// Ürün listesi
router.get('/urunler', async (req, res) => {
    try {
        const { sayfa = 1, ara, kategori, marka, durum } = req.query;
        const limit = 20;
        const offset = (sayfa - 1) * limit;

        const whereConditions = {};
        if (ara) {
            whereConditions[Op.or] = [
                { ad: { [Op.like]: `%${ara}%` } },
                { parca_no: { [Op.like]: `%${ara}%` } }
            ];
        }
        if (kategori) whereConditions.kategori_id = kategori;
        if (marka) whereConditions.marka_id = marka;
        if (durum !== undefined) whereConditions.durum = durum;

        const { count, rows: urunler } = await Product.findAndCountAll({
            where: whereConditions,
            include: [
                { model: Category, as: 'kategori', attributes: ['id', 'ad'] },
                { model: Brand, as: 'marka', attributes: ['id', 'ad'] },
                { model: ProductImage, as: 'resimler', limit: 1 }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        const kategoriler = await Category.findAll({ where: { durum: 1 }, order: [['ad', 'ASC']] });
        const markalar = await Brand.findAll({ where: { durum: 1 }, order: [['ad', 'ASC']] });

        res.render('admin/products/list', {
            title: 'Ürünler - Admin Panel',
            urunler,
            kategoriler,
            markalar,
            toplamUrun: count,
            mevcutSayfa: parseInt(sayfa),
            toplamSayfa: Math.ceil(count / limit),
            query: req.query
        });
    } catch (error) {
        console.error('Ürün listesi hatası:', error);
        req.flash('error_msg', 'Ürünler yüklenirken bir hata oluştu.');
        res.redirect('/admin');
    }
});

// Ürün ekleme formu
router.get('/urunler/ekle', async (req, res) => {
    try {
        const kategoriler = await Category.findAll({ where: { durum: 1 }, order: [['ad', 'ASC']] });
        const markalar = await Brand.findAll({ where: { durum: 1 }, order: [['ad', 'ASC']] });

        res.render('admin/products/form', {
            title: 'Yeni Ürün Ekle - Admin Panel',
            urun: null,
            kategoriler,
            markalar
        });
    } catch (error) {
        console.error('Ürün form hatası:', error);
        req.flash('error_msg', 'Form yüklenirken bir hata oluştu.');
        res.redirect('/admin/urunler');
    }
});

// Ürün ekleme işlemi
router.post('/urunler/ekle', uploadMultiple, async (req, res) => {
    try {
        const {
            parca_no, ad, kategori_id, marka_id, aciklama, kisa_aciklama,
            fiyat, kdv_orani, stok, min_siparis, paket_tipi, datasheet_url,
            durum, one_cikan, ozellik_adi, ozellik_degeri,
            kademe_min, kademe_max, kademe_fiyat
        } = req.body;

        // Ürün oluştur
        const urun = await Product.create({
            parca_no,
            ad,
            kategori_id,
            marka_id: marka_id || null,
            aciklama,
            kisa_aciklama,
            fiyat,
            kdv_orani: kdv_orani || 20,
            stok: stok || 0,
            min_siparis: min_siparis || 1,
            paket_tipi: paket_tipi || 'Diger',
            datasheet_url,
            durum: durum ? 1 : 0,
            one_cikan: one_cikan ? 1 : 0
        });

        // Resimleri kaydet
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                await ProductImage.create({
                    urun_id: urun.id,
                    resim_url: '/uploads/products/' + req.files[i].filename,
                    sira_no: i
                });
            }
        }

        // Özellikleri kaydet
        if (ozellik_adi && Array.isArray(ozellik_adi)) {
            for (let i = 0; i < ozellik_adi.length; i++) {
                if (ozellik_adi[i] && ozellik_degeri[i]) {
                    await ProductAttribute.create({
                        urun_id: urun.id,
                        ozellik_adi: ozellik_adi[i],
                        ozellik_degeri: ozellik_degeri[i]
                    });
                }
            }
        }

        // Fiyat kademelerini kaydet
        if (kademe_min && Array.isArray(kademe_min)) {
            for (let i = 0; i < kademe_min.length; i++) {
                if (kademe_min[i] && kademe_fiyat[i]) {
                    await ProductPriceTier.create({
                        urun_id: urun.id,
                        min_adet: kademe_min[i],
                        max_adet: kademe_max[i] || null,
                        fiyat: kademe_fiyat[i]
                    });
                }
            }
        }

        req.flash('success_msg', 'Ürün başarıyla eklendi.');
        res.redirect('/admin/urunler');
    } catch (error) {
        console.error('Ürün ekleme hatası:', error);
        req.flash('error_msg', 'Ürün eklenirken bir hata oluştu: ' + error.message);
        res.redirect('/admin/urunler/ekle');
    }
});

// Ürün düzenleme formu
router.get('/urunler/duzenle/:id', async (req, res) => {
    try {
        const urun = await Product.findByPk(req.params.id, {
            include: [
                { model: ProductImage, as: 'resimler', order: [['sira_no', 'ASC']] },
                { model: ProductAttribute, as: 'ozellikler' },
                { model: ProductPriceTier, as: 'fiyat_kademeleri', order: [['min_adet', 'ASC']] }
            ]
        });

        if (!urun) {
            req.flash('error_msg', 'Ürün bulunamadı.');
            return res.redirect('/admin/urunler');
        }

        const kategoriler = await Category.findAll({ where: { durum: 1 }, order: [['ad', 'ASC']] });
        const markalar = await Brand.findAll({ where: { durum: 1 }, order: [['ad', 'ASC']] });

        res.render('admin/products/form', {
            title: 'Ürün Düzenle - Admin Panel',
            urun,
            kategoriler,
            markalar
        });
    } catch (error) {
        console.error('Ürün düzenleme form hatası:', error);
        req.flash('error_msg', 'Ürün yüklenirken bir hata oluştu.');
        res.redirect('/admin/urunler');
    }
});

// Ürün güncelleme işlemi
router.post('/urunler/duzenle/:id', uploadMultiple, async (req, res) => {
    try {
        const urun = await Product.findByPk(req.params.id);

        if (!urun) {
            req.flash('error_msg', 'Ürün bulunamadı.');
            return res.redirect('/admin/urunler');
        }

        const {
            parca_no, ad, kategori_id, marka_id, aciklama, kisa_aciklama,
            fiyat, kdv_orani, stok, min_siparis, paket_tipi, datasheet_url,
            durum, one_cikan
        } = req.body;

        await urun.update({
            parca_no,
            ad,
            kategori_id,
            marka_id: marka_id || null,
            aciklama,
            kisa_aciklama,
            fiyat,
            kdv_orani: kdv_orani || 20,
            stok: stok || 0,
            min_siparis: min_siparis || 1,
            paket_tipi: paket_tipi || 'Diger',
            datasheet_url,
            durum: durum ? 1 : 0,
            one_cikan: one_cikan ? 1 : 0
        });

        // Yeni resimleri kaydet
        if (req.files && req.files.length > 0) {
            const maxSiraNo = await ProductImage.max('sira_no', { where: { urun_id: urun.id } }) || 0;
            for (let i = 0; i < req.files.length; i++) {
                await ProductImage.create({
                    urun_id: urun.id,
                    resim_url: '/uploads/products/' + req.files[i].filename,
                    sira_no: maxSiraNo + i + 1
                });
            }
        }

        req.flash('success_msg', 'Ürün başarıyla güncellendi.');
        res.redirect('/admin/urunler');
    } catch (error) {
        console.error('Ürün güncelleme hatası:', error);
        req.flash('error_msg', 'Ürün güncellenirken bir hata oluştu.');
        res.redirect('/admin/urunler/duzenle/' + req.params.id);
    }
});

// Ürün silme
router.post('/urunler/sil/:id', async (req, res) => {
    try {
        await Product.destroy({ where: { id: req.params.id } });
        req.flash('success_msg', 'Ürün başarıyla silindi.');
        res.redirect('/admin/urunler');
    } catch (error) {
        console.error('Ürün silme hatası:', error);
        req.flash('error_msg', 'Ürün silinirken bir hata oluştu.');
        res.redirect('/admin/urunler');
    }
});

// ===========================================
// KATEGORİ YÖNETİMİ
// ===========================================

router.get('/kategoriler', async (req, res) => {
    try {
        const kategoriler = await Category.findAll({
            include: [{ model: Category, as: 'alt_kategoriler' }],
            where: { parent_id: null },
            order: [['sira_no', 'ASC']]
        });

        res.render('admin/categories/list', {
            title: 'Kategoriler - Admin Panel',
            kategoriler
        });
    } catch (error) {
        console.error('Kategori listesi hatası:', error);
        req.flash('error_msg', 'Kategoriler yüklenirken bir hata oluştu.');
        res.redirect('/admin');
    }
});

router.get('/kategoriler/ekle', async (req, res) => {
    const ustKategoriler = await Category.findAll({
        where: { parent_id: null, durum: 1 },
        order: [['ad', 'ASC']]
    });
    res.render('admin/categories/form', {
        title: 'Yeni Kategori - Admin Panel',
        kategori: null,
        ustKategoriler
    });
});

router.post('/kategoriler/ekle', uploadSingle, async (req, res) => {
    try {
        const { ad, parent_id, aciklama, icon, sira_no, durum } = req.body;

        await Category.create({
            ad,
            parent_id: parent_id || null,
            aciklama,
            icon,
            resim: req.file ? '/uploads/categories/' + req.file.filename : null,
            sira_no: sira_no || 0,
            durum: durum ? 1 : 0
        });

        req.flash('success_msg', 'Kategori başarıyla eklendi.');
        res.redirect('/admin/kategoriler');
    } catch (error) {
        console.error('Kategori ekleme hatası:', error);
        req.flash('error_msg', 'Kategori eklenirken bir hata oluştu.');
        res.redirect('/admin/kategoriler/ekle');
    }
});

// ===========================================
// MARKA YÖNETİMİ
// ===========================================

router.get('/markalar', async (req, res) => {
    try {
        const markalar = await Brand.findAll({ order: [['ad', 'ASC']] });

        res.render('admin/brands/list', {
            title: 'Markalar - Admin Panel',
            markalar
        });
    } catch (error) {
        console.error('Marka listesi hatası:', error);
        req.flash('error_msg', 'Markalar yüklenirken bir hata oluştu.');
        res.redirect('/admin');
    }
});

router.post('/markalar/ekle', uploadSingle, async (req, res) => {
    try {
        const { ad, durum } = req.body;

        await Brand.create({
            ad,
            logo: req.file ? '/uploads/brands/' + req.file.filename : null,
            durum: durum ? 1 : 0
        });

        req.flash('success_msg', 'Marka başarıyla eklendi.');
        res.redirect('/admin/markalar');
    } catch (error) {
        console.error('Marka ekleme hatası:', error);
        req.flash('error_msg', 'Marka eklenirken bir hata oluştu.');
        res.redirect('/admin/markalar');
    }
});

// ===========================================
// SİPARİŞ YÖNETİMİ
// ===========================================

router.get('/siparisler', async (req, res) => {
    try {
        const { sayfa = 1, durum, ara } = req.query;
        const limit = 20;
        const offset = (sayfa - 1) * limit;

        const whereConditions = {};
        if (durum) whereConditions.siparis_durumu = durum;
        if (ara) whereConditions.siparis_no = { [Op.like]: `%${ara}%` };

        const { count, rows: siparisler } = await Order.findAndCountAll({
            where: whereConditions,
            include: [{ model: User, as: 'kullanici', attributes: ['ad', 'soyad', 'email'] }],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        res.render('admin/orders/list', {
            title: 'Siparişler - Admin Panel',
            siparisler,
            toplamSiparis: count,
            mevcutSayfa: parseInt(sayfa),
            toplamSayfa: Math.ceil(count / limit),
            query: req.query
        });
    } catch (error) {
        console.error('Sipariş listesi hatası:', error);
        req.flash('error_msg', 'Siparişler yüklenirken bir hata oluştu.');
        res.redirect('/admin');
    }
});

router.get('/siparisler/:id', async (req, res) => {
    try {
        const siparis = await Order.findByPk(req.params.id, {
            include: [
                { model: User, as: 'kullanici' },
                { model: OrderItem, as: 'urunler', include: [{ model: Product, as: 'urun' }] },
                { model: require('../models').Address, as: 'teslimat_adresi' },
                { model: require('../models').Address, as: 'fatura_adresi' }
            ]
        });

        if (!siparis) {
            req.flash('error_msg', 'Sipariş bulunamadı.');
            return res.redirect('/admin/siparisler');
        }

        res.render('admin/orders/detail', {
            title: `Sipariş #${siparis.siparis_no} - Admin Panel`,
            siparis
        });
    } catch (error) {
        console.error('Sipariş detay hatası:', error);
        req.flash('error_msg', 'Sipariş yüklenirken bir hata oluştu.');
        res.redirect('/admin/siparisler');
    }
});

router.post('/siparisler/:id/durum', async (req, res) => {
    try {
        const { siparis_durumu, kargo_takip_no, kargo_firmasi } = req.body;

        await Order.update({
            siparis_durumu,
            kargo_takip_no,
            kargo_firmasi
        }, { where: { id: req.params.id } });

        req.flash('success_msg', 'Sipariş durumu güncellendi.');
        res.redirect('/admin/siparisler/' + req.params.id);
    } catch (error) {
        console.error('Sipariş durum güncelleme hatası:', error);
        req.flash('error_msg', 'Sipariş güncellenirken bir hata oluştu.');
        res.redirect('/admin/siparisler/' + req.params.id);
    }
});

// ===========================================
// MÜŞTERİ YÖNETİMİ
// ===========================================

router.get('/musteriler', async (req, res) => {
    try {
        const { sayfa = 1, ara, uyelik_tipi } = req.query;
        const limit = 20;
        const offset = (sayfa - 1) * limit;

        const whereConditions = { rol: 'musteri' };
        if (ara) {
            whereConditions[Op.or] = [
                { ad: { [Op.like]: `%${ara}%` } },
                { soyad: { [Op.like]: `%${ara}%` } },
                { email: { [Op.like]: `%${ara}%` } }
            ];
        }
        if (uyelik_tipi) whereConditions.uyelik_tipi = uyelik_tipi;

        const { count, rows: musteriler } = await User.findAndCountAll({
            where: whereConditions,
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        res.render('admin/customers/list', {
            title: 'Müşteriler - Admin Panel',
            musteriler,
            toplamMusteri: count,
            mevcutSayfa: parseInt(sayfa),
            toplamSayfa: Math.ceil(count / limit),
            query: req.query
        });
    } catch (error) {
        console.error('Müşteri listesi hatası:', error);
        req.flash('error_msg', 'Müşteriler yüklenirken bir hata oluştu.');
        res.redirect('/admin');
    }
});

// ===========================================
// SLIDER YÖNETİMİ
// ===========================================

router.get('/slider', async (req, res) => {
    try {
        const sliders = await Slider.findAll({ order: [['sira_no', 'ASC']] });

        res.render('admin/slider/list', {
            title: 'Slider Yönetimi - Admin Panel',
            sliders
        });
    } catch (error) {
        console.error('Slider listesi hatası:', error);
        req.flash('error_msg', 'Slider verileri yüklenirken bir hata oluştu.');
        res.redirect('/admin');
    }
});

router.post('/slider/ekle', uploadSingle, async (req, res) => {
    try {
        const { baslik, alt_baslik, aciklama, link, buton_text, sira_no, durum } = req.body;

        await Slider.create({
            baslik,
            alt_baslik,
            aciklama,
            resim_url: req.file ? '/uploads/slider/' + req.file.filename : null,
            link,
            buton_text: buton_text || 'Keşfet',
            sira_no: sira_no || 0,
            durum: durum ? 1 : 0
        });

        req.flash('success_msg', 'Slider başarıyla eklendi.');
        res.redirect('/admin/slider');
    } catch (error) {
        console.error('Slider ekleme hatası:', error);
        req.flash('error_msg', 'Slider eklenirken bir hata oluştu.');
        res.redirect('/admin/slider');
    }
});

module.exports = router;
