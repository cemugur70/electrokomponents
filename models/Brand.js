'use strict';
const slugify = require('slugify');

module.exports = (sequelize, DataTypes) => {
    const Brand = sequelize.define('Brand', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        ad: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Marka adı boş olamaz' }
            }
        },
        slug: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true
        },
        logo: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        durum: {
            type: DataTypes.TINYINT,
            defaultValue: 1
        }
    }, {
        tableName: 'markalar',
        timestamps: true,
        underscored: true,
        hooks: {
            beforeValidate: (brand) => {
                if (brand.ad) {
                    brand.slug = slugify(brand.ad, {
                        lower: true,
                        strict: true
                    });
                }
            }
        }
    });

    Brand.associate = function (models) {
        Brand.hasMany(models.Product, {
            foreignKey: 'marka_id',
            as: 'urunler'
        });
    };

    return Brand;
};
