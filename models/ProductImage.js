'use strict';

module.exports = (sequelize, DataTypes) => {
    const ProductImage = sequelize.define('ProductImage', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        urun_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        resim_url: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        sira_no: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        tableName: 'urun_resimleri',
        timestamps: false,
        underscored: true
    });

    ProductImage.associate = function (models) {
        ProductImage.belongsTo(models.Product, {
            foreignKey: 'urun_id',
            as: 'urun'
        });
    };

    return ProductImage;
};
