'use strict';

module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define('Order', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        siparis_no: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        teslimat_adresi_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        fatura_adresi_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        ara_toplam: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        kdv_toplam: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        kargo_ucreti: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        indirim_tutari: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        toplam_tutar: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        odeme_durumu: {
            type: DataTypes.ENUM('beklemede', 'odendi', 'iptal', 'iade'),
            defaultValue: 'beklemede'
        },
        siparis_durumu: {
            type: DataTypes.ENUM('beklemede', 'onaylandi', 'hazirlaniyor', 'kargoda', 'teslim_edildi', 'iptal'),
            defaultValue: 'beklemede'
        },
        iyzico_payment_id: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        iyzico_basket_id: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        kargo_takip_no: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        kargo_firmasi: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        notlar: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        ip_adresi: {
            type: DataTypes.STRING(50),
            allowNull: true
        }
    }, {
        tableName: 'siparisler',
        timestamps: true,
        underscored: true,
        hooks: {
            beforeCreate: async (order) => {
                // Benzersiz sipariş numarası oluştur
                const tarih = new Date();
                const yil = tarih.getFullYear().toString().slice(-2);
                const ay = (tarih.getMonth() + 1).toString().padStart(2, '0');
                const gun = tarih.getDate().toString().padStart(2, '0');
                const rastgele = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                order.siparis_no = `EK${yil}${ay}${gun}${rastgele}`;
            }
        }
    });

    Order.associate = function (models) {
        Order.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'kullanici'
        });

        Order.belongsTo(models.Address, {
            foreignKey: 'teslimat_adresi_id',
            as: 'teslimat_adresi'
        });

        Order.belongsTo(models.Address, {
            foreignKey: 'fatura_adresi_id',
            as: 'fatura_adresi'
        });

        Order.hasMany(models.OrderItem, {
            foreignKey: 'siparis_id',
            as: 'urunler'
        });
    };

    return Order;
};
