# ElectroKomponents - Hostinger Node.js Hosting Deployment Rehberi

Bu belge, ElectroKomponents e-ticaret uygulamasının Hostinger'ın Node.js Web Hosting (hPanel) üzerinden nasıl deploy edileceğini açıklar.

## Gereksinimler

- Hostinger Business veya Cloud Hosting planı
- MySQL veritabanı (hPanel'den oluşturulur)
- Node.js 18.x veya 20.x

---

## 1. Veritabanı Oluşturma

1. [hPanel](https://hpanel.hostinger.com)'e giriş yapın
2. Sol menüden **Databases** → **MySQL Databases** seçin
3. Yeni veritabanı oluşturun:
   - **Database name**: `electrokomponents`
   - **Username**: `electro_user`
   - **Password**: Güçlü bir şifre belirleyin
4. Veritabanı bilgilerini not edin

---

## 2. Proje Dosyalarını Hazırlama

### 2.1 .env Dosyasını Düzenleme

Projenizin `.env` dosyasını production için güncelleyin:

```env
NODE_ENV=production
PORT=3000
SITE_URL=https://sizin-domain.com

# Veritabanı (hPanel'den aldığınız bilgiler)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u123456789_electrokomponents
DB_USER=u123456789_electro
DB_PASS=veritabani_sifreniz

# JWT Secret (32+ karakter, rastgele)
JWT_SECRET=cok_guclu_rastgele_jwt_secret_key_32_karakter

# Iyzico (sandbox veya production)
IYZICO_API_KEY=api_key_buraya
IYZICO_SECRET_KEY=secret_key_buraya
IYZICO_BASE_URL=https://api.iyzipay.com

# SMTP (Hostinger email veya harici)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=info@sizin-domain.com
SMTP_PASS=email_sifreniz
SMTP_FROM=info@sizin-domain.com
```

### 2.2 package.json Kontrol

`package.json` dosyasında `start` script'inin doğru olduğundan emin olun:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### 2.3 ZIP Dosyası Oluşturma

1. Proje klasörünüzü açın
2. Aşağıdaki dosya/klasörleri **hariç tutarak** ZIP oluşturun:
   - `node_modules/` (Hostinger otomatik yükleyecek)
   - `.git/`
   - `logs/`
   - `.env.example` (sadece `.env` yükleyin)

**Windows'ta:**
```
electrokomponents.zip içeriği:
├── config/
├── controllers/
├── middleware/
├── models/
├── public/
├── routes/
├── seeders/
├── services/
├── views/
├── server.js
├── package.json
├── package-lock.json
└── .env
```

---

## 3. hPanel'den Node.js Uygulaması Oluşturma

1. **hPanel** → **Websites** → **Add Website** veya mevcut sitenizi seçin
2. **Node.js Web App** seçeneğini tıklayın
3. **Upload Your Project** (Projenizi Yükle) seçin
4. Hazırladığınız `electrokomponents.zip` dosyasını yükleyin

### Build Ayarları

hPanel size build ayarlarını soracak:

| Ayar | Değer |
|------|-------|
| **Node.js Version** | 18.x veya 20.x |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Entry Point** | `server.js` |

5. **Deploy** butonuna tıklayın

---

## 4. Veritabanı Migration

hPanel'de terminal erişimi varsa:

```bash
npm run migrate
npm run seed
```

Terminal erişimi yoksa, veritabanını manuel oluşturmanız gerekir:

### phpMyAdmin ile Tablo Oluşturma

1. hPanel → **Databases** → **phpMyAdmin**
2. Veritabanınızı seçin
3. SQL sekmesine gidin
4. Aşağıdaki SQL'leri sırayla çalıştırın:

```sql
-- Users tablosu
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ad VARCHAR(100) NOT NULL,
    soyad VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    sifre VARCHAR(255) NOT NULL,
    telefon VARCHAR(20),
    uyelik_tipi ENUM('bireysel', 'kurumsal') DEFAULT 'bireysel',
    firma_adi VARCHAR(255),
    vergi_no VARCHAR(20),
    vergi_dairesi VARCHAR(100),
    rol ENUM('kullanici', 'admin') DEFAULT 'kullanici',
    durum BOOLEAN DEFAULT TRUE,
    email_dogrulandi BOOLEAN DEFAULT FALSE,
    email_izni BOOLEAN DEFAULT FALSE,
    sms_izni BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- Diğer tablolar için migration dosyalarına bakın
-- veya Sequelize sync kullanın
```

**Alternatif:** İlk çalıştırmada Sequelize'ın tabloları otomatik oluşturması için `server.js`'e şu satırı ekleyin:

```javascript
// Sadece ilk deployment için, sonra kaldırın!
db.sequelize.sync({ alter: true });
```

---

## 5. Uploads Klasörü

Ürün resimleri için `public/uploads` klasörünün yazma izinleri olmalı:

1. hPanel → **File Manager**
2. `public/uploads` klasörüne gidin
3. Sağ tık → **Permissions** → `755` olarak ayarlayın

---

## 6. Domain ve SSL

### 6.1 Domain Ayarlama

1. hPanel → **Domains**
2. Domain'inizi sitenize bağlayın

### 6.2 SSL Sertifikası

1. hPanel → **SSL**
2. **Install SSL** → Let's Encrypt seçin
3. Otomatik yenileme aktif olsun

---

## 7. Uygulama Yönetimi

### Yeniden Başlatma

hPanel → **Websites** → Siteniz → **Restart**

### Log Görüntüleme

hPanel → **Websites** → Siteniz → **Logs**

### Güncelleme Yapma

1. Yeni ZIP dosyası hazırlayın
2. hPanel → **Websites** → **Upload Files**
3. Yeni dosyaları yükleyin
4. **Redeploy** tıklayın

---

## 8. Önemli Notlar

### Port Ayarı
Hostinger otomatik olarak port ataması yapar. `process.env.PORT` kullanın:

```javascript
const PORT = process.env.PORT || 3000;
```

### Statik Dosyalar
Express static middleware doğru yapılandırılmış olmalı:

```javascript
app.use(express.static('public'));
```

### Session Store
Production'da session için veritabanı veya Redis kullanın:

```javascript
// Session için MySQL store (önerilir)
const MySQLStore = require('express-mysql-session')(session);
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});
```

---

## 9. Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| 502 Bad Gateway | Log'ları kontrol edin, `npm start` çalışıyor mu? |
| DB Bağlantı Hatası | `.env` veritabanı bilgilerini kontrol edin |
| Static dosyalar yüklenmiyor | `public` klasör yolunu kontrol edin |
| Upload çalışmıyor | `public/uploads` izinlerini kontrol edin (755) |

### Destek

Hostinger destek ekibiyle iletişime geçin:
- hPanel → **Help** → **Contact Support**

---

## 10. Checklist

Deployment öncesi kontrol listesi:

- [ ] `.env` production değerleriyle güncellendi
- [ ] `node_modules` ZIP'e dahil edilmedi
- [ ] Veritabanı oluşturuldu
- [ ] SSL sertifikası aktif
- [ ] `public/uploads` yazma izni var
- [ ] Iyzico API bilgileri production için güncellendi
- [ ] SMTP ayarları test edildi
