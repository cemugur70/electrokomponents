/**
 * Web Routes
 * Ana sayfa ve frontend rotaları
 */

const express = require('express');
const router = express.Router();
const { loadUser } = require('../middleware/auth');

// Modeller
const { Product, Category, Brand, Slider, ProductImage, ProductPriceTier, ProductAttribute } = require('../models');
const { Op } = require('sequelize');

// Tüm rotalarda kullanıcı bilgisini yükle
router.use(loadUser);

// ===========================================
// ANA SAYFA
// ===========================================

router.get('/', async (req, res) => {
    try {
        // Slider'ları getir
        const sliders = await Slider.findAll({
            where: { durum: 1 },
            order: [['sira_no', 'ASC']]
        });

        // Ana kategorileri getir
        const kategoriler = await Category.findAll({
            where: { parent_id: null, durum: 1 },
            order: [['sira_no', 'ASC']],
            limit: 8
        });

        // Öne çıkan ürünleri getir
        const oneCikanUrunler = await Product.findAll({
            where: { durum: 1, one_cikan: 1 },
            include: [
                { model: ProductImage, as: 'resimler', limit: 1 },
                { model: Brand, as: 'marka' },
                { model: Category, as: 'kategori' }
            ],
            order: [['created_at', 'DESC']],
            limit: 8
        });

        // Yeni ürünleri getir
        const yeniUrunler = await Product.findAll({
            where: { durum: 1 },
            include: [
                { model: ProductImage, as: 'resimler', limit: 1 },
                { model: Brand, as: 'marka' }
            ],
            order: [['created_at', 'DESC']],
            limit: 12
        });

        // Markaları getir
        const markalar = await Brand.findAll({
            where: { durum: 1 },
            order: [['ad', 'ASC']]
        });

        res.render('pages/home', {
            title: 'Ana Sayfa - ElectroKomponents',
            sliders,
            kategoriler,
            oneCikanUrunler,
            yeniUrunler,
            markalar
        });
    } catch (error) {
        console.error('Ana sayfa hatası:', error);
        res.render('pages/home', {
            title: 'Ana Sayfa - ElectroKomponents',
            sliders: [],
            kategoriler: [],
            oneCikanUrunler: [],
            yeniUrunler: [],
            markalar: [],
            error_msg: 'Veriler yüklenirken bir hata oluştu.'
        });
    }
});

// ===========================================
// ÜRÜN LİSTELEME (KATEGORİ)
// ===========================================

router.get('/kategori/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const { sayfa = 1, siralama = 'yeni', marka, fiyat_min, fiyat_max, paket_tipi, stok } = req.query;
        const limit = 12;
        const offset = (sayfa - 1) * limit;

        // Kategoriyi bul
        const kategori = await Category.findOne({
            where: { slug, durum: 1 },
            include: [
                { model: Category, as: 'alt_kategoriler', where: { durum: 1 }, required: false },
                { model: Category, as: 'ust_kategori' }
            ]
        });

        if (!kategori) {
            return res.status(404).render('errors/404', {
                title: 'Kategori Bulunamadı'
            });
        }

        // Filtre koşullarını oluştur
        const whereConditions = {
            kategori_id: kategori.id,
            durum: 1
        };

        if (marka) {
            whereConditions.marka_id = marka.split(',').map(Number);
        }

        if (fiyat_min || fiyat_max) {
            whereConditions.fiyat = {};
            if (fiyat_min) whereConditions.fiyat[Op.gte] = parseFloat(fiyat_min);
            if (fiyat_max) whereConditions.fiyat[Op.lte] = parseFloat(fiyat_max);
        }

        if (paket_tipi) {
            whereConditions.paket_tipi = paket_tipi.split(',');
        }

        if (stok === '1') {
            whereConditions.stok = { [Op.gt]: 0 };
        }

        // Sıralama
        let order = [['created_at', 'DESC']];
        if (siralama === 'fiyat-artan') order = [['fiyat', 'ASC']];
        if (siralama === 'fiyat-azalan') order = [['fiyat', 'DESC']];
        if (siralama === 'ad') order = [['ad', 'ASC']];

        // Ürünleri getir
        const { count, rows: urunler } = await Product.findAndCountAll({
            where: whereConditions,
            include: [
                { model: ProductImage, as: 'resimler', limit: 1 },
                { model: Brand, as: 'marka' }
            ],
            order,
            limit,
            offset
        });

        // Filtre seçenekleri için markaları getir
        const filterMarkalar = await Brand.findAll({
            where: { durum: 1 },
            order: [['ad', 'ASC']]
        });

        const toplamSayfa = Math.ceil(count / limit);

        res.render('products/catalog', {
            title: `${kategori.ad} - ElectroKomponents`,
            kategori,
            urunler,
            markalar: filterMarkalar,
            toplamUrun: count,
            mevcutSayfa: parseInt(sayfa),
            toplamSayfa,
            query: req.query
        });
    } catch (error) {
        console.error('Kategori sayfası hatası:', error);
        res.status(500).render('errors/500', { title: 'Sunucu Hatası' });
    }
});

// ===========================================
// ÜRÜN DETAY
// ===========================================

router.get('/urun/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const urun = await Product.findOne({
            where: { slug, durum: 1 },
            include: [
                { model: ProductImage, as: 'resimler', order: [['sira_no', 'ASC']] },
                { model: Brand, as: 'marka' },
                { model: Category, as: 'kategori' },
                { model: ProductAttribute, as: 'ozellikler' },
                { model: ProductPriceTier, as: 'fiyat_kademeleri', order: [['min_adet', 'ASC']] }
            ]
        });

        if (!urun) {
            return res.status(404).render('errors/404', {
                title: 'Ürün Bulunamadı'
            });
        }

        // Görüntüleme sayısını artır
        await urun.increment('goruntuleme_sayisi');

        // Benzer ürünleri getir
        const benzerUrunler = await Product.findAll({
            where: {
                kategori_id: urun.kategori_id,
                id: { [Op.ne]: urun.id },
                durum: 1
            },
            include: [
                { model: ProductImage, as: 'resimler', limit: 1 },
                { model: Brand, as: 'marka' }
            ],
            limit: 4
        });

        res.render('products/detail', {
            title: `${urun.ad} - ElectroKomponents`,
            urun,
            benzerUrunler
        });
    } catch (error) {
        console.error('Ürün detay hatası:', error);
        res.status(500).render('errors/500', { title: 'Sunucu Hatası' });
    }
});

// ===========================================
// ARAMA
// ===========================================

router.get('/ara', async (req, res) => {
    try {
        const { q, sayfa = 1, siralama = 'alaka' } = req.query;
        const limit = 12;
        const offset = (sayfa - 1) * limit;

        if (!q || q.trim().length < 2) {
            return res.render('products/search', {
                title: 'Arama - ElectroKomponents',
                urunler: [],
                aramaMetni: q || '',
                toplamUrun: 0,
                mevcutSayfa: 1,
                toplamSayfa: 0
            });
        }

        const whereConditions = {
            durum: 1,
            [Op.or]: [
                { ad: { [Op.like]: `%${q}%` } },
                { parca_no: { [Op.like]: `%${q}%` } },
                { aciklama: { [Op.like]: `%${q}%` } }
            ]
        };

        let order = [['goruntuleme_sayisi', 'DESC']]; // Alaka düzeni
        if (siralama === 'fiyat-artan') order = [['fiyat', 'ASC']];
        if (siralama === 'fiyat-azalan') order = [['fiyat', 'DESC']];
        if (siralama === 'yeni') order = [['created_at', 'DESC']];

        const { count, rows: urunler } = await Product.findAndCountAll({
            where: whereConditions,
            include: [
                { model: ProductImage, as: 'resimler', limit: 1 },
                { model: Brand, as: 'marka' },
                { model: Category, as: 'kategori' }
            ],
            order,
            limit,
            offset
        });

        const toplamSayfa = Math.ceil(count / limit);

        res.render('products/search', {
            title: `"${q}" için arama sonuçları - ElectroKomponents`,
            urunler,
            aramaMetni: q,
            toplamUrun: count,
            mevcutSayfa: parseInt(sayfa),
            toplamSayfa,
            query: req.query
        });
    } catch (error) {
        console.error('Arama hatası:', error);
        res.status(500).render('errors/500', { title: 'Sunucu Hatası' });
    }
});

// ===========================================
// STATİK SAYFALAR
// ===========================================

router.get('/hakkimizda', (req, res) => {
    res.render('pages/about', { title: 'Hakkımızda - ElectroKomponents' });
});

router.get('/iletisim', (req, res) => {
    res.render('pages/contact', { title: 'İletişim - ElectroKomponents' });
});

router.get('/teslimat-ve-iade', (req, res) => {
    res.render('pages/shipping', { title: 'Teslimat ve İade - ElectroKomponents' });
});

router.get('/gizlilik-politikasi', (req, res) => {
    res.render('pages/privacy', { title: 'Gizlilik Politikası - ElectroKomponents' });
});

router.get('/kvkk', (req, res) => {
    res.render('pages/kvkk', { title: 'KVKK Aydınlatma Metni - ElectroKomponents' });
});

module.exports = router;
