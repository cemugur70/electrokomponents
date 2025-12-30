'use strict';

module.exports = (sequelize, DataTypes) => {
    const Favorite = sequelize.define('Favorite', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        urun_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        tableName: 'favoriler',
        timestamps: true,
        underscored: true,
        updatedAt: false,
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'urun_id']
            }
        ]
    });

    Favorite.associate = function (models) {
        Favorite.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'kullanici'
        });

        Favorite.belongsTo(models.Product, {
            foreignKey: 'urun_id',
            as: 'urun'
        });
    };

    return Favorite;
};
