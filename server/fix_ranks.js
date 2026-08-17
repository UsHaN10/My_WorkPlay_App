const { User } = require('./models');

const fixRanks = async () => {
    try {
        const users = await User.findAll({ where: { role: 'worker' } });
        console.log(`Found ${users.length} workers. Checking ranks...`);

        for (const user of users) {
            let oldRank = user.rank;
            let newRank = 'Novice';

            if (user.xp >= 5000) newRank = 'Diamond';
            else if (user.xp >= 3000) newRank = 'Platinum';
            else if (user.xp >= 1000) newRank = 'Gold';
            else if (user.xp >= 500) newRank = 'Silver';
            else if (user.xp >= 100) newRank = 'Bronze';

            if (oldRank !== newRank) {
                user.rank = newRank;
                await user.save();
                console.log(`Updated ${user.username}: ${oldRank} -> ${newRank} (XP: ${user.xp})`);
            }
        }
        console.log('Rank synchronization complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing ranks:', error);
        process.exit(1);
    }
};

fixRanks();
