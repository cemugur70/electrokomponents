/**
 * Multer Upload Middleware
 * Dosya yükleme konfigürasyonu
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Upload klasörünü oluştur
const uploadDir = path.join(__dirname, '../public/uploads');
const productImagesDir = path.join(uploadDir, 'products');
const brandLogosDir = path.join(uploadDir, 'brands');
const categoryImagesDir = path.join(uploadDir, 'categories');
const sliderImagesDir = path.join(uploadDir, 'slider');

[uploadDir, productImagesDir, brandLogosDir, categoryImagesDir, sliderImagesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Disk storage ayarları
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let dest = uploadDir;

        if (req.baseUrl.includes('urun') || req.originalUrl.includes('urun')) {
            dest = productImagesDir;
        } else if (req.baseUrl.includes('marka') || req.originalUrl.includes('marka')) {
            dest = brandLogosDir;
        } else if (req.baseUrl.includes('kategori') || req.originalUrl.includes('kategori')) {
            dest = categoryImagesDir;
        } else if (req.baseUrl.includes('slider') || req.originalUrl.includes('slider')) {
            dest = sliderImagesDir;
        }

        cb(null, dest);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

// Dosya filtresi
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Sadece resim dosyaları yüklenebilir (jpeg, jpg, png, gif, webp, svg)'));
    }
};

// PDF filtresi (datasheet için)
const pdfFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        return cb(null, true);
    }
    cb(new Error('Sadece PDF dosyaları yüklenebilir'));
};

// Upload middleware'leri
const uploadImage = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: fileFilter
});

const uploadPDF = multer({
    storage: multer.diskStorage({
        destination: path.join(uploadDir, 'datasheets'),
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + '.pdf');
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: pdfFilter
});

module.exports = {
    uploadImage,
    uploadPDF,
    uploadSingle: uploadImage.single('resim'),
    uploadMultiple: uploadImage.array('resimler', 10),
    uploadDatasheet: uploadPDF.single('datasheet')
};
