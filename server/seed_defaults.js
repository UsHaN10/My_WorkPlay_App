const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        const hashedPassword = await bcrypt.hash('Admin123', 10);
        await User.findOrCreate({
            where: { username: 'admin' },
            defaults: {
                password: hashedPassword,
                role: 'admin',
                fullName: 'System Admin',
                email: 'admin@workplay.com',
                department: 'Management'
            }
        });

        const workerPassword = await bcrypt.hash('Worker123', 10);
        await User.findOrCreate({
            where: { username: 'worker1' },
            defaults: {
                password: workerPassword,
                role: 'worker',
                fullName: 'John Worker',
                email: 'worker@workplay.com',
                department: 'Production'
            }
        });

        console.log('Default users seeded successfully.');
    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        process.exit();
    }
}

seed();
