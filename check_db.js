const { User, Task, Transaction } = require('./server/models');

async function check() {
    try {
        const user = await User.findOne({ where: { username: 'worker0' } });
        if (!user) {
            console.log("User worker0 not found");
            return;
        }
        console.log("User found:", {
            id: user.id,
            username: user.username,
            coins: user.coins,
            xp: user.xp,
            rank: user.rank
        });

        const completedTasks = await Task.findAll({ where: { assignedToUserId: user.id, status: 'completed' } });
        console.log("Completed Tasks Count:", completedTasks.length);
        completedTasks.forEach(t => console.log(` - Task ID: ${t.id}, Title: ${t.title}, Reward: ${t.rewardCoins}`));

        const txs = await Transaction.findAll({ where: { UserId: user.id } });
        console.log("Transactions Count:", txs.length);
        txs.forEach(tx => console.log(` - TX: ${tx.reason}, Amount: ${tx.amount}`));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

check();
