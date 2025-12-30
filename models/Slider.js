'use strict';

module.exports = (sequelize, DataTypes) => {
    const Slider = sequelize.define('Slider', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        baslik: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        alt_baslik: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        aciklama: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        resim_url: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        link: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        buton_text: {
            type: DataTypes.STRING(100),
            defaultValue: 'Keşfet'
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
        tableName: 'slider',
        timestamps: true,
        underscored: true
    });

    return Slider;
};
