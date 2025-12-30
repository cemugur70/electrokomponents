'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const hashedPassword = await bcrypt.hash('Admin123!', 10);

        await queryInterface.bulkInsert('users', [{
            ad: 'Admin',
            soyad: 'User',
            email: 'admin@electrokomponents.com',
            telefon: '5001234567',
            sifre: hashedPassword,
            rol: 'admin',
            uyelik_tipi: 'kurumsal',
            email_dogrulama: 1,
            durum: 1,
            created_at: new Date(),
            updated_at: new Date()
        }], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('users', {
            email: 'admin@electrokomponents.com'
        }, {});
    }
};
