'use strict';
const slugify = require('slugify');

module.exports = (sequelize, DataTypes) => {
    const Category = sequelize.define('Category', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        parent_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        ad: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Kategori adı boş olamaz' }
            }
        },
        slug: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true
        },
        icon: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        resim: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        aciklama: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        sira_no: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        durum: {
            type: DataTypes.TINYINT,
            defaultValue: 1
        }
    }, {
        tableName: 'kategoriler',
        timestamps: true,
        underscored: true,
        hooks: {
            beforeValidate: (category) => {
                if (category.ad) {
                    category.slug = slugify(category.ad, {
                        lower: true,
                        strict: true,
                        locale: 'tr'
                    });
                }
            }
        }
    });

    Category.associate = function (models) {
        // Üst kategori ilişkisi
        Category.belongsTo(models.Category, {
            foreignKey: 'parent_id',
            as: 'ust_kategori'
        });

        // Alt kategoriler
        Category.hasMany(models.Category, {
            foreignKey: 'parent_id',
            as: 'alt_kategoriler'
        });

        // Ürünler
        Category.hasMany(models.Product, {
            foreignKey: 'kategori_id',
            as: 'urunler'
        });
    };

    return Category;
};
