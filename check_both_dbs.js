const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

async function checkDb(dbPath) {
    console.log(`\n--- Checking Database: ${dbPath} ---`);
    const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: dbPath,
        logging: false
    });

    const User = sequelize.define('User', {
        username: { type: DataTypes.STRING },
        password: { type: DataTypes.STRING },
        role: { type: DataTypes.STRING }
    }, { tableName: 'Users', timestamps: true });

    try {
        const users = await User.findAll({ attributes: ['username'] });
        console.log('Users:', users.map(u => u.username).join(', '));
    } catch (err) {
        console.log('Error or Table not found');
    }
}

async function run() {
    await checkDb(path.join(process.cwd(), 'database.sqlite'));
    await checkDb(path.join(process.cwd(), 'server', 'database.sqlite'));
    process.exit(0);
}

run();
