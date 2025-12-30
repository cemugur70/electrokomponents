'use strict';

module.exports = (sequelize, DataTypes) => {
    const OrderItem = sequelize.define('OrderItem', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        siparis_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        urun_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        urun_adi: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        parca_no: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        adet: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        birim_fiyat: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        kdv_orani: {
            type: DataTypes.INTEGER,
            defaultValue: 20
        },
        toplam_fiyat: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        }
    }, {
        tableName: 'siparis_urunleri',
        timestamps: false,
        underscored: true
    });

    OrderItem.associate = function (models) {
        OrderItem.belongsTo(models.Order, {
            foreignKey: 'siparis_id',
            as: 'siparis'
        });

        OrderItem.belongsTo(models.Product, {
            foreignKey: 'urun_id',
            as: 'urun'
        });
    };

    return OrderItem;
};
