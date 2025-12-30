'use strict';

module.exports = (sequelize, DataTypes) => {
    const Cart = sequelize.define('Cart', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true // Misafir kullanıcılar için null olabilir
        },
        session_id: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        urun_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        adet: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        }
    }, {
        tableName: 'sepet',
        timestamps: true,
        underscored: true
    });

    Cart.associate = function (models) {
        Cart.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'kullanici'
        });

        Cart.belongsTo(models.Product, {
            foreignKey: 'urun_id',
            as: 'urun'
        });
    };

    return Cart;
};
