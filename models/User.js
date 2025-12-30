'use strict';
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        ad: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Ad alanı boş olamaz' },
                len: { args: [2, 100], msg: 'Ad 2-100 karakter arasında olmalıdır' }
            }
        },
        soyad: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Soyad alanı boş olamaz' },
                len: { args: [2, 100], msg: 'Soyad 2-100 karakter arasında olmalıdır' }
            }
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: { msg: 'Geçerli bir e-posta adresi giriniz' }
            }
        },
        telefon: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        sifre: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        uyelik_tipi: {
            type: DataTypes.ENUM('bireysel', 'kurumsal'),
            defaultValue: 'bireysel'
        },
        firma_adi: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        vergi_no: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        vergi_dairesi: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        rol: {
            type: DataTypes.ENUM('musteri', 'admin'),
            defaultValue: 'musteri'
        },
        durum: {
            type: DataTypes.TINYINT,
            defaultValue: 1
        },
        email_dogrulandi: {
            type: DataTypes.TINYINT,
            defaultValue: 0
        },
        dogrulama_kodu: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        sifre_sifirlama_kodu: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        sifre_sifirlama_zamani: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'users',
        timestamps: true,
        underscored: true,
        hooks: {
            beforeCreate: async (user) => {
                if (user.sifre) {
                    const salt = await bcrypt.genSalt(10);
                    user.sifre = await bcrypt.hash(user.sifre, salt);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('sifre')) {
                    const salt = await bcrypt.genSalt(10);
                    user.sifre = await bcrypt.hash(user.sifre, salt);
                }
            }
        }
    });

    // Şifre karşılaştırma metodu
    User.prototype.sifreKarsilastir = async function (girilensifre) {
        return await bcrypt.compare(girilensifre, this.sifre);
    };

    // Tam ad getter
    User.prototype.tamAd = function () {
        return `${this.ad} ${this.soyad}`;
    };

    // İlişkiler
    User.associate = function (models) {
        User.hasMany(models.Address, {
            foreignKey: 'user_id',
            as: 'adresler'
        });
        User.hasMany(models.Order, {
            foreignKey: 'user_id',
            as: 'siparisler'
        });
        User.hasMany(models.Cart, {
            foreignKey: 'user_id',
            as: 'sepet'
        });
        User.hasMany(models.Favorite, {
            foreignKey: 'user_id',
            as: 'favoriler'
        });
    };

    return User;
};
