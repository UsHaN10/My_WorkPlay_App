const { User } = require('./models');

async function checkWorker() {
    try {
        const worker = await User.findOne({ where: { username: 'worker1' } });
        if (worker) {
            console.log(`Worker: ${worker.username}`);
            console.log(`XP: ${worker.xp}`);
            console.log(`Rank: ${worker.rank}`);
        } else {
            console.log('Worker1 not found');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkWorker();
