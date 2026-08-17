const { User } = require('./models');
const fs = require('fs');

async function exportUsers() {
    try {
        const users = await User.findAll({ attributes: ['id', 'username', 'role'] });
        fs.writeFileSync('users_debug.txt', JSON.stringify(users, null, 2));
        console.log('Users exported to users_debug.txt');
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}

exportUsers();
