const { User, sequelize } = require('./models');
const bcrypt = require('bcryptjs');

async function fixData() {
    try {
        const hashedPassword = await bcrypt.hash('123456', 10);

        // Fetch all users
        const users = await User.findAll();

        console.log('--- Fixing User Data ---');
        for (const user of users) {
            const lowerUsername = user.username.toLowerCase();
            const updates = { username: lowerUsername };

            // Reset common test users to 123456
            if (['worker1', 'admin0', 'admin'].includes(lowerUsername)) {
                updates.password = hashedPassword;
                console.log(`Updating ${lowerUsername}: Lowercased username and reset password to 123456`);
            } else if (user.username !== lowerUsername) {
                console.log(`Updating ${user.username}: Lowercased username only`);
            }

            await user.update(updates);
        }

        console.log('--- Data Fix Complete ---');
        process.exit(0);
    } catch (err) {
        console.error('Data Fix Error:', err);
        process.exit(1);
    }
}

fixData();
