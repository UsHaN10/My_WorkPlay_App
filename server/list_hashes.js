const { User } = require('./models');

async function listHashes() {
    try {
        const users = await User.findAll({ attributes: ['id', 'username', 'password', 'role'] });
        console.log('--- Current User Hashes ---');
        users.forEach(u => {
            console.log(`ID: ${u.id}, User: ${u.username}, Role: ${u.role}, Hash: ${u.password}`);
        });
        console.log('---------------------------');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listHashes();
