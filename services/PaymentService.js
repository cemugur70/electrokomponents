/**
 * Iyzico Payment Service
 * Iyzico ödeme entegrasyonu
 */

const Iyzipay = require('iyzipay');

// Iyzico konfigürasyonu
const iyzipay = new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY,
    secretKey: process.env.IYZICO_SECRET_KEY,
    uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com'
});

class PaymentService {
    /**
     * Checkout Form oluştur
     * @param {Object} siparis - Sipariş bilgileri
     * @param {Object} kullanici - Kullanıcı bilgileri
     * @param {Array} urunler - Sepet ürünleri
     * @param {Object} adres - Teslimat adresi
     * @returns {Promise<Object>} Checkout form response
     */
    static async createCheckoutForm(siparis, kullanici, urunler, adres) {
        const basketItems = urunler.map(item => ({
            id: item.urun_id.toString(),
            name: item.urun.ad.substring(0, 50),
            category1: item.urun.kategori ? item.urun.kategori.ad : 'Genel',
            itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
            price: (parseFloat(item.urun.fiyat) * item.adet).toFixed(2)
        }));

        const toplam = urunler.reduce((sum, item) => {
            return sum + (parseFloat(item.urun.fiyat) * item.adet);
        }, 0);

        const request = {
            locale: Iyzipay.LOCALE.TR,
            conversationId: siparis.siparis_no,
            price: toplam.toFixed(2),
            paidPrice: toplam.toFixed(2),
            currency: Iyzipay.CURRENCY.TRY,
            basketId: siparis.siparis_no,
            paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
            callbackUrl: `${process.env.SITE_URL}/odeme/callback`,
            enabledInstallments: [1, 2, 3, 6, 9, 12],
            buyer: {
                id: kullanici.id.toString(),
                name: kullanici.ad,
                surname: kullanici.soyad,
                gsmNumber: kullanici.telefon || '+905555555555',
                email: kullanici.email,
                identityNumber: '11111111111', // TCKN (test için)
                registrationAddress: adres.acik_adres,
                ip: siparis.ip_adresi || '127.0.0.1',
                city: adres.il,
                country: 'Turkey',
                zipCode: adres.posta_kodu || '34000'
            },
            shippingAddress: {
                contactName: `${kullanici.ad} ${kullanici.soyad}`,
                city: adres.il,
                country: 'Turkey',
                address: adres.acik_adres,
                zipCode: adres.posta_kodu || '34000'
            },
            billingAddress: {
                contactName: kullanici.firma_adi || `${kullanici.ad} ${kullanici.soyad}`,
                city: adres.il,
                country: 'Turkey',
                address: adres.acik_adres,
                zipCode: adres.posta_kodu || '34000'
            },
            basketItems
        };

        return new Promise((resolve, reject) => {
            iyzipay.checkoutFormInitialize.create(request, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    /**
     * Ödeme sonucunu doğrula
     * @param {string} token - Iyzico callback token
     * @returns {Promise<Object>} Payment result
     */
    static async retrievePaymentResult(token) {
        const request = {
            locale: Iyzipay.LOCALE.TR,
            token: token
        };

        return new Promise((resolve, reject) => {
            iyzipay.checkoutForm.retrieve(request, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    /**
     * İade işlemi
     * @param {string} paymentTransactionId - Ödeme transaction ID
     * @param {number} price - İade tutarı
     * @param {string} ip - IP adresi
     * @returns {Promise<Object>} Refund result
     */
    static async refund(paymentTransactionId, price, ip) {
        const request = {
            locale: Iyzipay.LOCALE.TR,
            conversationId: Date.now().toString(),
            paymentTransactionId: paymentTransactionId,
            price: price.toFixed(2),
            currency: Iyzipay.CURRENCY.TRY,
            ip: ip || '127.0.0.1'
        };

        return new Promise((resolve, reject) => {
            iyzipay.refund.create(request, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    /**
     * Taksit seçeneklerini getir
     * @param {string} binNumber - Kart BIN numarası (ilk 6 hane)
     * @param {number} price - Toplam tutar
     * @returns {Promise<Object>} Installment options
     */
    static async getInstallmentInfo(binNumber, price) {
        const request = {
            locale: Iyzipay.LOCALE.TR,
            conversationId: Date.now().toString(),
            binNumber: binNumber,
            price: price.toFixed(2)
        };

        return new Promise((resolve, reject) => {
            iyzipay.installmentInfo.retrieve(request, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }
}

module.exports = PaymentService;
