'use strict';

module.exports = (sequelize, DataTypes) => {
    const Setting = sequelize.define('Setting', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        anahtar: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        deger: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        grup: {
            type: DataTypes.STRING(50),
            defaultValue: 'genel'
        },
        tip: {
            type: DataTypes.ENUM('text', 'textarea', 'number', 'boolean', 'json'),
            defaultValue: 'text'
        },
        aciklama: {
            type: DataTypes.STRING(255),
            allowNull: true
        }
    }, {
        tableName: 'ayarlar',
        timestamps: true,
        underscored: true
    });

    // Ayar değeri almak için statik metod
    Setting.getValue = async function (anahtar, varsayilan = null) {
        const ayar = await this.findOne({ where: { anahtar } });
        if (!ayar) return varsayilan;

        if (ayar.tip === 'boolean') {
            return ayar.deger === '1' || ayar.deger === 'true';
        }
        if (ayar.tip === 'number') {
            return parseFloat(ayar.deger);
        }
        if (ayar.tip === 'json') {
            try {
                return JSON.parse(ayar.deger);
            } catch {
                return varsayilan;
            }
        }
        return ayar.deger;
    };

    // Ayar değeri kaydetmek için statik metod
    Setting.setValue = async function (anahtar, deger, grup = 'genel') {
        const [ayar, created] = await this.findOrCreate({
            where: { anahtar },
            defaults: { anahtar, deger, grup }
        });

        if (!created) {
            ayar.deger = typeof deger === 'object' ? JSON.stringify(deger) : deger;
            await ayar.save();
        }

        return ayar;
    };

    return Setting;
};
