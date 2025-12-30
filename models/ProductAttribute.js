'use strict';

module.exports = (sequelize, DataTypes) => {
    const ProductAttribute = sequelize.define('ProductAttribute', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        urun_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        ozellik_adi: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        ozellik_degeri: {
            type: DataTypes.STRING(255),
            allowNull: false
        }
    }, {
        tableName: 'urun_ozellikleri',
        timestamps: false,
        underscored: true
    });

    ProductAttribute.associate = function (models) {
        ProductAttribute.belongsTo(models.Product, {
            foreignKey: 'urun_id',
            as: 'urun'
        });
    };

    return ProductAttribute;
};
