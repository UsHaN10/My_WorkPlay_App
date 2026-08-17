const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const mysql = require('mysql2/promise');

// Database Config for XAMPP
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'workplay_db',
    dialect: 'mysql',
    logging: false
};

// Function to initialize Sequelize
let sequelize;

const initializeDatabase = async () => {
    try {
        // 1. Connect to MySQL server (no DB) to ensure DB exists
        const connection = await mysql.createConnection({ host: dbConfig.host, user: dbConfig.user, password: dbConfig.password });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
        await connection.end();

        // 2. Connect to the specific database
        sequelize = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
            host: dbConfig.host,
            dialect: dbConfig.dialect,
            logging: dbConfig.logging
        });

        console.log('MySQL Database connected successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

// Immediate initialization for export (handled slightly differently to keep sync imports working)
// Since CommonJS requires sync exports, we'll export a "getSequelize" or handle the instance carefully.
// However, rewriting the whole index.js to be async-export compatible is tricky for existing imports.
// A simpler approach for XAMPP development:
// Just initialize Sequelize normally, but we might fail if DB doesn't exist. 
// Adding the auto-create logic in a separate script or pre-boot is cleaner, but let was try to keep it inline for simplicity if possible.

// REVISED APPROACH:
const isMySQL = false; // Set to true to use MySQL (requires XAMPP/MySQL running)

if (isMySQL) {
    sequelize = new Sequelize('workplay_db', 'root', '', {
        host: '127.0.0.1',
        dialect: 'mysql',
        logging: false,
    });
} else {
    const dbPath = path.join(__dirname, '..', 'database_v2.sqlite');
    console.log(`Using Database at: ${dbPath}`);
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: dbPath,
        logging: false
    });
}

// Fallback logic check will be handled in server/index.js or we can do it here by authenticating
// (async () => {
//     try {
//         await sequelize.authenticate();
//         console.log('MySQL connected successfully.');
//     } catch (err) {
//         console.error('MySQL connection failed, falling back to SQLite.', err.message);
//         sequelize = new Sequelize({
//             dialect: 'sqlite',
//             storage: './database.sqlite',
//             logging: false
//         });
//     }
// })();

const User = sequelize.define('User', {
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'worker'), allowNull: false },
    isVIP: { type: DataTypes.BOOLEAN, defaultValue: false }, // VIP access for special admin features
    fullName: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
    department: { type: DataTypes.STRING, defaultValue: 'Production Department' },
    jobRole: {
        type: DataTypes.ENUM('Sewing Machine Operator', 'Line Leader', 'Production Supervisor', 'Production Manager'),
        allowNull: true
    },
    rank: { type: DataTypes.STRING, defaultValue: 'Novice' },
    xp: { type: DataTypes.INTEGER, defaultValue: 0 },
    coins: { type: DataTypes.INTEGER, defaultValue: 0 },
    sp: { type: DataTypes.INTEGER, defaultValue: 0 }, // Skill Points
    skillLevels: { type: DataTypes.JSON, defaultValue: {} }, // Detailed skill points {"Garment Basics": 50}
    profilePic: { type: DataTypes.STRING, allowNull: true },
}, {
    hooks: {
        beforeSave: (user) => {
            if (user.xp >= 25000) user.rank = 'Grandmaster';
            else if (user.xp >= 10000) user.rank = 'Master';
            else if (user.xp >= 5000) user.rank = 'Diamond';
            else if (user.xp >= 2000) user.rank = 'Gold';
            else if (user.xp >= 1000) user.rank = 'Silver';
            else if (user.xp >= 300) user.rank = 'Bronze';
            else user.rank = 'Novice';
        }
    }
});

const Task = sequelize.define('Task', {
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    rewardCoins: { type: DataTypes.INTEGER, allowNull: false },
    rewardXp: { type: DataTypes.INTEGER, allowNull: false },
    rewardSp: { type: DataTypes.INTEGER, defaultValue: 0 }, // Reward Skill Points
    skillCategory: { type: DataTypes.STRING, allowNull: true }, // Ties task to a specific skill tree node
    targetRole: { type: DataTypes.STRING, allowNull: true }, // Ties unassigned task to a specific role
    status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'pending_review', 'completed', 'rejected'),
        defaultValue: 'pending'
    },
    assignedToUserId: { type: DataTypes.INTEGER, allowNull: true },
    verificationPhoto: { type: DataTypes.STRING, allowNull: true },
    workerComment: { type: DataTypes.TEXT, allowNull: true },
    adminComment: { type: DataTypes.TEXT, allowNull: true },
}, {
    indexes: [
        { fields: ['assignedToUserId'] },
        { fields: ['status'] }
    ]
});

const Transaction = sequelize.define('Transaction', {
    amount: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.ENUM('earn', 'spend'), allowNull: false },
    reason: { type: DataTypes.STRING },
}, {
    indexes: [
        { fields: ['UserId'] }
    ]
});

const ExchangeRequest = sequelize.define('ExchangeRequest', {
    amount: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
    adminMessage: { type: DataTypes.STRING },
}, {
    indexes: [
        { fields: ['UserId'] },
        { fields: ['status'] }
    ]
});

const Treasury = sequelize.define('Treasury', {
    balance: { type: DataTypes.INTEGER, defaultValue: 0 },
});

const MintRequest = sequelize.define('MintRequest', {
    amount: { type: DataTypes.INTEGER, allowNull: false },
    paymentReference: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
    approvalsCount: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
    indexes: [
        { fields: ['requesterId'] },
        { fields: ['status'] }
    ]
});

const MintApproval = sequelize.define('MintApproval', {
    // Linked implicitly
}, {
    indexes: [
        { unique: true, fields: ['MintRequestId', 'approverId'] }
    ]
});

// Relationships
User.hasMany(Transaction);
Transaction.belongsTo(User);

User.hasMany(ExchangeRequest);
ExchangeRequest.belongsTo(User);

User.hasMany(MintRequest, { foreignKey: 'requesterId' });
MintRequest.belongsTo(User, { as: 'requester', foreignKey: 'requesterId' });

MintRequest.hasMany(MintApproval);
MintApproval.belongsTo(MintRequest);

User.hasMany(MintApproval, { foreignKey: 'approverId' });
MintApproval.belongsTo(User, { as: 'approver', foreignKey: 'approverId' });

User.hasMany(Task, { foreignKey: 'assignedToUserId' });
Task.belongsTo(User, { foreignKey: 'assignedToUserId' });

// Automatic Ranking Hook
User.beforeSave(async (user) => {
    if (user.xp >= 5000) user.rank = 'Diamond';
    else if (user.xp >= 3000) user.rank = 'Platiner';
    else if (user.xp >= 1000) user.rank = 'Gold';
    else if (user.xp >= 500) user.rank = 'Silver';
    else if (user.xp >= 100) user.rank = 'Bronze';
    else user.rank = 'Novice';
});

module.exports = {
    sequelize,
    User,
    Task,
    Transaction,
    ExchangeRequest,
    Treasury,
    MintRequest,
    MintApproval
};
