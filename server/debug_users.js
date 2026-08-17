const { User } = require('./models');

async function checkUsers() {
    try {
        const users = await User.findAll();
        console.log('--- Users in Database ---');
        users.forEach(u => {
            console.log(`ID: ${u.id}, Username: ${u.username}, Role: ${u.role}`);
        });
        console.log('-------------------------');
        process.exit(0);
    } catch (err) {
        console.error('Error fetching users:', err);
        process.exit(1);
    }
}

checkUsers();
