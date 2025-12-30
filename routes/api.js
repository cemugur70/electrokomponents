/**
 * API Routes
 * REST API endpoints
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { Product, Category, Brand, Cart, Favorite, ProductImage, ProductPriceTier } = require('../models');
const { Op } = require('sequelize');

// ===========================================
// ÜRÜN API'LERİ
// ===========================================

// Ürün listesi
router.get('/urunler', async (req, res) => {
    try {
        const {
            kategori, marka, q, sayfa = 1, limit = 12,
            siralama = 'yeni', fiyat_min, fiyat_max, stok
        } = req.query;

        const offset = (sayfa - 1) * limit;
        const whereConditions = { durum: 1 };

        if (kategori) whereConditions.kategori_id = kategori;
        if (marka) whereConditions.marka_id = { [Op.in]: marka.split(',') };
        if (q) {
            whereConditions[Op.or] = [
                { ad: { [Op.like]: `%${q}%` } },
                { parca_no: { [Op.like]: `%${q}%` } }
            ];
        }
        if (fiyat_min || fiyat_max) {
            whereConditions.fiyat = {};
            if (fiyat_min) whereConditions.fiyat[Op.gte] = parseFloat(fiyat_min);
            if (fiyat_max) whereConditions.fiyat[Op.lte] = parseFloat(fiyat_max);
        }
        if (stok === '1') whereConditions.stok = { [Op.gt]: 0 };

        let order = [['created_at', 'DESC']];
        if (siralama === 'fiyat-artan') order = [['fiyat', 'ASC']];
        if (siralama === 'fiyat-azalan') order = [['fiyat', 'DESC']];
        if (siralama === 'ad') order = [['ad', 'ASC']];

        const { count, rows } = await Product.findAndCountAll({
            where: whereConditions,
            include: [
                { model: ProductImage, as: 'resimler', limit: 1 },
                { model: Brand, as: 'marka', attributes: ['id', 'ad', 'slug'] },
                { model: Category, as: 'kategori', attributes: ['id', 'ad', 'slug'] }
            ],
            order,
            limit: parseInt(limit),
            offset
        });

        res.json({
            success: true,
            data: {
                urunler: rows,
                toplam: count,
                sayfa: parseInt(sayfa),
                toplamSayfa: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Ürün listesi hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// Ürün detay
router.get('/urunler/:slug', async (req, res) => {
    try {
        const urun = await Product.findOne({
            where: { slug: req.params.slug, durum: 1 },
            include: [
                { model: ProductImage, as: 'resimler' },
                { model: Brand, as: 'marka' },
                { model: Category, as: 'kategori' },
                { model: ProductPriceTier, as: 'fiyat_kademeleri', order: [['min_adet', 'ASC']] }
            ]
        });

        if (!urun) {
            return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });
        }

        res.json({ success: true, data: urun });
    } catch (error) {
        console.error('Ürün detay hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// Arama (Autocomplete)
router.get('/urunler/ara/autocomplete', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.json({ success: true, data: [] });
        }

        const urunler = await Product.findAll({
            where: {
                durum: 1,
                [Op.or]: [
                    { ad: { [Op.like]: `%${q}%` } },
                    { parca_no: { [Op.like]: `%${q}%` } }
                ]
            },
            attributes: ['id', 'ad', 'parca_no', 'slug', 'fiyat'],
            include: [{ model: ProductImage, as: 'resimler', limit: 1 }],
            limit: 8
        });

        res.json({ success: true, data: urunler });
    } catch (error) {
        console.error('Autocomplete hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// ===========================================
// KATEGORİ API'LERİ
// ===========================================

router.get('/kategoriler', async (req, res) => {
    try {
        const kategoriler = await Category.findAll({
            where: { durum: 1, parent_id: null },
            include: [{
                model: Category,
                as: 'alt_kategoriler',
                where: { durum: 1 },
                required: false
            }],
            order: [['sira_no', 'ASC']]
        });

        res.json({ success: true, data: kategoriler });
    } catch (error) {
        console.error('Kategori listesi hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// ===========================================
// SEPET API'LERİ
// ===========================================

// Sepet içeriği
router.get('/sepet', async (req, res) => {
    try {
        let sepetItems = [];

        if (req.session.user) {
            // Giriş yapmış kullanıcı
            sepetItems = await Cart.findAll({
                where: { user_id: req.session.user.id },
                include: [{
                    model: Product,
                    as: 'urun',
                    include: [{ model: ProductImage, as: 'resimler', limit: 1 }]
                }]
            });
        } else {
            // Misafir kullanıcı
            sepetItems = req.session.sessionCart || [];
        }

        // Toplam hesapla
        let araToplam = 0;
        sepetItems.forEach(item => {
            const fiyat = item.urun ? parseFloat(item.urun.fiyat) : item.fiyat;
            araToplam += fiyat * item.adet;
        });

        res.json({
            success: true,
            data: {
                items: sepetItems,
                araToplam,
                adet: sepetItems.length
            }
        });
    } catch (error) {
        console.error('Sepet hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// Sepete ekle
router.post('/sepet/ekle', async (req, res) => {
    try {
        const { urun_id, adet = 1 } = req.body;

        // Ürünü kontrol et
        const urun = await Product.findOne({
            where: { id: urun_id, durum: 1 },
            include: [{ model: ProductImage, as: 'resimler', limit: 1 }]
        });

        if (!urun) {
            return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });
        }

        // Stok kontrolü
        if (urun.stok < adet) {
            return res.status(400).json({ success: false, message: 'Yeterli stok yok' });
        }

        if (req.session.user) {
            // Giriş yapmış kullanıcı - veritabanına kaydet
            const existingItem = await Cart.findOne({
                where: { user_id: req.session.user.id, urun_id }
            });

            if (existingItem) {
                existingItem.adet += parseInt(adet);
                await existingItem.save();
            } else {
                await Cart.create({
                    user_id: req.session.user.id,
                    urun_id,
                    adet: parseInt(adet)
                });
            }
        } else {
            // Misafir kullanıcı - session'a kaydet
            if (!req.session.sessionCart) {
                req.session.sessionCart = [];
            }

            const existingIndex = req.session.sessionCart.findIndex(item => item.urun_id === urun_id);

            if (existingIndex > -1) {
                req.session.sessionCart[existingIndex].adet += parseInt(adet);
            } else {
                req.session.sessionCart.push({
                    urun_id,
                    adet: parseInt(adet),
                    urun: {
                        id: urun.id,
                        ad: urun.ad,
                        parca_no: urun.parca_no,
                        fiyat: urun.fiyat,
                        slug: urun.slug,
                        resimler: urun.resimler
                    }
                });
            }
        }

        res.json({ success: true, message: 'Ürün sepete eklendi' });
    } catch (error) {
        console.error('Sepete ekleme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// Sepet güncelle
router.put('/sepet/guncelle', async (req, res) => {
    try {
        const { urun_id, adet } = req.body;

        if (adet < 1) {
            return res.status(400).json({ success: false, message: 'Adet en az 1 olmalıdır' });
        }

        if (req.session.user) {
            await Cart.update(
                { adet },
                { where: { user_id: req.session.user.id, urun_id } }
            );
        } else {
            const index = req.session.sessionCart?.findIndex(item => item.urun_id === urun_id);
            if (index > -1) {
                req.session.sessionCart[index].adet = parseInt(adet);
            }
        }

        res.json({ success: true, message: 'Sepet güncellendi' });
    } catch (error) {
        console.error('Sepet güncelleme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// Sepetten sil
router.delete('/sepet/sil/:urun_id', async (req, res) => {
    try {
        const { urun_id } = req.params;

        if (req.session.user) {
            await Cart.destroy({
                where: { user_id: req.session.user.id, urun_id }
            });
        } else {
            req.session.sessionCart = req.session.sessionCart?.filter(
                item => item.urun_id !== parseInt(urun_id)
            );
        }

        res.json({ success: true, message: 'Ürün sepetten silindi' });
    } catch (error) {
        console.error('Sepetten silme hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// ===========================================
// FAVORİ API'LERİ
// ===========================================

router.post('/favoriler/toggle', isAuthenticated, async (req, res) => {
    try {
        const { urun_id } = req.body;
        const user_id = req.session.user.id;

        const existing = await Favorite.findOne({ where: { user_id, urun_id } });

        if (existing) {
            await existing.destroy();
            res.json({ success: true, message: 'Favorilerden çıkarıldı', isFavorite: false });
        } else {
            await Favorite.create({ user_id, urun_id });
            res.json({ success: true, message: 'Favorilere eklendi', isFavorite: true });
        }
    } catch (error) {
        console.error('Favori toggle hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

router.get('/favoriler', isAuthenticated, async (req, res) => {
    try {
        const favoriler = await Favorite.findAll({
            where: { user_id: req.session.user.id },
            include: [{
                model: Product,
                as: 'urun',
                include: [
                    { model: ProductImage, as: 'resimler', limit: 1 },
                    { model: Brand, as: 'marka' }
                ]
            }]
        });

        res.json({ success: true, data: favoriler });
    } catch (error) {
        console.error('Favoriler hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

module.exports = router;
