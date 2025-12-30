'use strict';

module.exports = (sequelize, DataTypes) => {
    const Address = sequelize.define('Address', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        baslik: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Adres başlığı boş olamaz' }
            }
        },
        ad_soyad: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        telefon: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        il: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        ilce: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        adres: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        posta_kodu: {
            type: DataTypes.STRING(10),
            allowNull: true
        },
        varsayilan: {
            type: DataTypes.TINYINT,
            defaultValue: 0
        }
    }, {
        tableName: 'adresler',
        timestamps: true,
        underscored: true
    });

    Address.associate = function (models) {
        Address.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'kullanici'
        });
    };

    return Address;
};
