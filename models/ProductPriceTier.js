'use strict';

module.exports = (sequelize, DataTypes) => {
    const ProductPriceTier = sequelize.define('ProductPriceTier', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        urun_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        min_adet: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        max_adet: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        fiyat: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        }
    }, {
        tableName: 'urun_fiyat_kademeleri',
        timestamps: false,
        underscored: true
    });

    ProductPriceTier.associate = function (models) {
        ProductPriceTier.belongsTo(models.Product, {
            foreignKey: 'urun_id',
            as: 'urun'
        });
    };

    return ProductPriceTier;
};
