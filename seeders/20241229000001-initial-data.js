'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Kategoriler
        await queryInterface.bulkInsert('kategoriler', [
            {
                id: 1,
                parent_id: null,
                ad: 'Yarı İletkenler',
                slug: 'yari-iletkenler',
                icon: 'fas fa-microchip',
                sira_no: 1,
                durum: 1,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 2,
                parent_id: null,
                ad: 'Pasif Bileşenler',
                slug: 'pasif-bilesenler',
                icon: 'fas fa-wave-square',
                sira_no: 2,
                durum: 1,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 3,
                parent_id: null,
                ad: 'Elektromekanik',
                slug: 'elektromekanik',
                icon: 'fas fa-plug',
                sira_no: 3,
                durum: 1,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 4,
                parent_id: null,
                ad: 'Konnektörler',
                slug: 'konnektorler',
                icon: 'fas fa-ethernet',
                sira_no: 4,
                durum: 1,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 5,
                parent_id: null,
                ad: 'Otomasyon',
                slug: 'otomasyon',
                icon: 'fas fa-robot',
                sira_no: 5,
                durum: 1,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 6,
                parent_id: null,
                ad: 'Araçlar & Gereçler',
                slug: 'araclar-gerecler',
                icon: 'fas fa-tools',
                sira_no: 6,
                durum: 1,
                created_at: new Date(),
                updated_at: new Date()
            },
            // Alt Kategoriler - Yarı İletkenler
            {
                id: 7,
                parent_id: 1,
                ad: 'Mikrodenetleyiciler',
                slug: 'mikrodenetleyiciler',
                icon: 'fas fa-microchip',
                sira_no: 1,
                durum: 1,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 8,
                parent_id: 1,
                ad: 'Transistörler',
                slug: 'transistorler',
                icon: 'fas fa-microchip',
                sira_no: 2,
                durum: 1,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 9,
                parent_id: 1,
                ad: 'Diyotlar',
                slug: 'diyotlar',
                icon: 'fas fa-microchip',
                sira_no: 3,
                durum: 1,
                created_at: new Date(),
                updated_at: new Date()
            },
            // Alt Kategoriler - Pasif Bileşenler
            {
                id: 10,
                parent_id: 2,
                ad: 'Dirençler',
                slug: 'direncler',
                icon: 'fas fa-wave-square',
                sira_no: 1,
                durum: 1,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 11,
                parent_id: 2,
                ad: 'Kapasitörler',
                slug: 'kapasitorler',
                icon: 'fas fa-battery-half',
                sira_no: 2,
                durum: 1,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 12,
                parent_id: 2,
                ad: 'İndüktörler',
                slug: 'indukturler',
                icon: 'fas fa-wave-square',
                sira_no: 3,
                durum: 1,
                created_at: new Date(),
                updated_at: new Date()
            }
        ], {});

        // Markalar
        await queryInterface.bulkInsert('markalar', [
            { id: 1, ad: 'Texas Instruments', slug: 'texas-instruments', durum: 1, created_at: new Date(), updated_at: new Date() },
            { id: 2, ad: 'STMicroelectronics', slug: 'stmicroelectronics', durum: 1, created_at: new Date(), updated_at: new Date() },
            { id: 3, ad: 'Microchip', slug: 'microchip', durum: 1, created_at: new Date(), updated_at: new Date() },
            { id: 4, ad: 'NXP Semiconductors', slug: 'nxp-semiconductors', durum: 1, created_at: new Date(), updated_at: new Date() },
            { id: 5, ad: 'Analog Devices', slug: 'analog-devices', durum: 1, created_at: new Date(), updated_at: new Date() },
            { id: 6, ad: 'Infineon', slug: 'infineon', durum: 1, created_at: new Date(), updated_at: new Date() },
            { id: 7, ad: 'ON Semiconductor', slug: 'on-semiconductor', durum: 1, created_at: new Date(), updated_at: new Date() },
            { id: 8, ad: 'Vishay', slug: 'vishay', durum: 1, created_at: new Date(), updated_at: new Date() },
            { id: 9, ad: 'Murata', slug: 'murata', durum: 1, created_at: new Date(), updated_at: new Date() },
            { id: 10, ad: 'TDK', slug: 'tdk', durum: 1, created_at: new Date(), updated_at: new Date() }
        ], {});

        // Slider
        await queryInterface.bulkInsert('slider', [
            {
                id: 1,
                baslik: 'Elektronik Komponent Tedarikçiniz',
                alt_baslik: 'Endüstriyel Çözümler',
                aciklama: '50.000\'den fazla ürün, hızlı teslimat ve teknik destek',
                resim_url: '/images/slider-1.jpg',
                link: '/kategori/yari-iletkenler',
                buton_text: 'Ürünleri Keşfet',
                sira_no: 1,
                durum: 1,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 2,
                baslik: 'Kurumsal Çözümler',
                alt_baslik: 'Toplu Alımlarda Özel Fiyatlar',
                aciklama: 'Proje bazlı fiyatlandırma ve teknik danışmanlık',
                resim_url: '/images/slider-2.jpg',
                link: '/iletisim',
                buton_text: 'İletişime Geç',
                sira_no: 2,
                durum: 1,
                created_at: new Date(),
                updated_at: new Date()
            }
        ], {});

        // Ayarlar
        await queryInterface.bulkInsert('ayarlar', [
            { id: 1, anahtar: 'site_adi', deger: 'ElectroKomponents', grup: 'genel', tip: 'text', created_at: new Date(), updated_at: new Date() },
            { id: 2, anahtar: 'site_slogan', deger: 'Elektronik Komponent E-Ticaret Platformu', grup: 'genel', tip: 'text', created_at: new Date(), updated_at: new Date() },
            { id: 3, anahtar: 'iletisim_telefon', deger: '+90 (212) 555 00 00', grup: 'iletisim', tip: 'text', created_at: new Date(), updated_at: new Date() },
            { id: 4, anahtar: 'iletisim_email', deger: 'info@electrokomponents.com', grup: 'iletisim', tip: 'text', created_at: new Date(), updated_at: new Date() },
            { id: 5, anahtar: 'iletisim_adres', deger: 'Maslak Mahallesi, Aos 55. Sokak, 42 Maslak Ofis 3, İstanbul', grup: 'iletisim', tip: 'textarea', created_at: new Date(), updated_at: new Date() },
            { id: 6, anahtar: 'kargo_ucreti', deger: '29.90', grup: 'kargo', tip: 'number', created_at: new Date(), updated_at: new Date() },
            { id: 7, anahtar: 'ucretsiz_kargo_limiti', deger: '500', grup: 'kargo', tip: 'number', created_at: new Date(), updated_at: new Date() },
            { id: 8, anahtar: 'kdv_orani', deger: '20', grup: 'vergi', tip: 'number', created_at: new Date(), updated_at: new Date() }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('ayarlar', null, {});
        await queryInterface.bulkDelete('slider', null, {});
        await queryInterface.bulkDelete('markalar', null, {});
        await queryInterface.bulkDelete('kategoriler', null, {});
    }
};
