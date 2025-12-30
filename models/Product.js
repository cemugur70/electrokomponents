'use strict';
const slugify = require('slugify');

module.exports = (sequelize, DataTypes) => {
    const Product = sequelize.define('Product', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        kategori_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        marka_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        parca_no: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: { msg: 'Parça numarası boş olamaz' }
            }
        },
        ad: {
            type: DataTypes.STRING(500),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Ürün adı boş olamaz' }
            }
        },
        slug: {
            type: DataTypes.STRING(500),
            allowNull: false,
            unique: true
        },
        aciklama: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        kisa_aciklama: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        fiyat: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        },
        kdv_orani: {
            type: DataTypes.INTEGER,
            defaultValue: 20
        },
        stok: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        min_siparis: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        paket_tipi: {
            type: DataTypes.ENUM('SMD', 'Radial', 'DIP', 'QFP', 'BGA', 'Diger'),
            defaultValue: 'Diger'
        },
        datasheet_url: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        durum: {
            type: DataTypes.TINYINT,
            defaultValue: 1
        },
        one_cikan: {
            type: DataTypes.TINYINT,
            defaultValue: 0
        },
        goruntuleme_sayisi: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        tableName: 'urunler',
        timestamps: true,
        underscored: true,
        hooks: {
            beforeValidate: (product) => {
                if (product.ad) {
                    const baseSlug = slugify(product.ad, {
                        lower: true,
                        strict: true,
                        locale: 'tr'
                    });
                    product.slug = `${baseSlug}-${product.parca_no?.toLowerCase() || ''}`;
                }
            }
        }
    });

    // Fiyat hesaplama metodu (KDV dahil)
    Product.prototype.kdvliFiyat = function () {
        const kdvTutar = parseFloat(this.fiyat) * (this.kdv_orani / 100);
        return (parseFloat(this.fiyat) + kdvTutar).toFixed(2);
    };

    Product.associate = function (models) {
        Product.belongsTo(models.Category, {
            foreignKey: 'kategori_id',
            as: 'kategori'
        });

        Product.belongsTo(models.Brand, {
            foreignKey: 'marka_id',
            as: 'marka'
        });

        Product.hasMany(models.ProductImage, {
            foreignKey: 'urun_id',
            as: 'resimler'
        });

        Product.hasMany(models.ProductAttribute, {
            foreignKey: 'urun_id',
            as: 'ozellikler'
        });

        Product.hasMany(models.ProductPriceTier, {
            foreignKey: 'urun_id',
            as: 'fiyat_kademeleri'
        });

        Product.hasMany(models.Cart, {
            foreignKey: 'urun_id',
            as: 'sepet_kayitlari'
        });

        Product.hasMany(models.Favorite, {
            foreignKey: 'urun_id',
            as: 'favori_kayitlari'
        });
    };

    return Product;
};
